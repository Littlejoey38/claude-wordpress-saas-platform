'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatPanel, type Message, type PermissionType } from '@/components/ChatPanel'
import { WordPressIframe, type WordPressContext, type SelectedBlock } from '@/components/WordPressIframe'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { type Tool } from '@/components/ToolsMenu'

// Liste initiale des tools disponibles (correspondant aux 19 tools du serveur)
const INITIAL_TOOLS: Tool[] = [
  // WordPress Tools
  { id: 'discover_available_blocks', name: 'Découvrir les blocs', category: 'wordpress', enabled: true },
  { id: 'get_page_summary', name: 'Résumé de page', category: 'wordpress', enabled: true },
  { id: 'inspect_block_schema', name: 'Inspecter schéma bloc', category: 'wordpress', enabled: true },
  { id: 'get_block_attributes_group', name: 'Attributs par groupe', category: 'wordpress', enabled: true },
  { id: 'get_theme_design_system', name: 'Design system thème', category: 'wordpress', enabled: true },
  { id: 'get_patterns', name: 'Liste des patterns', category: 'wordpress', enabled: true },
  { id: 'get_pattern_details', name: 'Détails pattern', category: 'wordpress', enabled: true },
  { id: 'create_post', name: 'Créer post/page', category: 'wordpress', enabled: true },
  { id: 'update_post', name: 'Modifier post/page', category: 'wordpress', enabled: true },
  { id: 'search_block_templates', name: 'Templates de blocs', category: 'wordpress', enabled: true },

  // Gutenberg Tools (Temps Réel)
  { id: 'get_blocks_structure', name: 'Structure des blocs (clientIds)', category: 'gutenberg', enabled: true },
  { id: 'insert_block_realtime', name: 'Insérer bloc', category: 'gutenberg', enabled: true },
  { id: 'update_block_by_clientid', name: 'Modifier bloc (clientId)', category: 'gutenberg', enabled: true },
  { id: 'remove_block_realtime', name: 'Supprimer bloc', category: 'gutenberg', enabled: true },
  { id: 'replace_block_realtime', name: 'Remplacer bloc', category: 'gutenberg', enabled: true },

  // FSE Tools
  { id: 'get_global_styles', name: 'Styles globaux', category: 'fse', enabled: true },
  { id: 'update_global_styles', name: 'Modifier styles', category: 'fse', enabled: true },
  { id: 'get_template_parts', name: 'Template parts', category: 'fse', enabled: true },
  { id: 'get_site_editor_settings', name: 'Paramètres éditeur', category: 'fse', enabled: true },
]

export default function EditorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [credits, setCredits] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const [wordpressContext, setWordpressContext] = useState<WordPressContext | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(null)
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS)

  // Ref to the WordPress iframe for sending PostMessage commands
  const iframeWindowRef = useRef<Window | null>(null)

  // Message ID counter to avoid duplicate keys when multiple messages arrive in same millisecond
  const messageIdCounter = useRef(0)

  // Helper to generate unique message IDs
  const generateMessageId = (prefix: string) => {
    messageIdCounter.current += 1
    return `${prefix}-${messageIdCounter.current}`
  }

  // WordPress URL from env
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://nectar-template.wp.local'

  // Persist last iframe URL in localStorage
  // Initialize with default to avoid SSR/client hydration mismatch
  const [lastIframeUrl, setLastIframeUrl] = useState<string>(`${wordpressUrl}/wp-admin`)

  // Load saved URL from localStorage after component mounts (client-side only)
  useEffect(() => {
    const savedUrl = localStorage.getItem('lastIframeUrl')
    if (savedUrl) {
      setLastIframeUrl(savedUrl)
    }
  }, [])

  // Prevent Cmd+R / Ctrl+R from only reloading the iframe
  // Instead, force full page reload
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+R (Mac) or Ctrl+R (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault()
        // Force full page reload
        window.location.reload()
      }
    }

    // Add event listener at document level to capture before iframe
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  const handleSendMessage = async (messageContent: string, permissionType: PermissionType, extendedThinking: boolean) => {
    // Add user message
    const userMessage: Message = {
      id: generateMessageId('user'),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Decrement credits (client-side simulation for MVP)
    setCredits((prev) => Math.max(0, prev - 1))

    try {
      // Use fetch to initiate SSE connection
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AGENT_API_URL}/agent/process-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageContent,
            permission_type: permissionType, // NEW: Pass permission type to backend
            extended_thinking: extendedThinking, // NEW: Pass extended thinking flag to backend
            conversation_id: conversationId, // IMPORTANT: Send conversation ID if exists
            wordpress_context: wordpressContext, // Include WordPress context
            enabled_tools: tools.filter(t => t.enabled).map(t => t.id), // NEW: Send list of enabled tools
            conversationHistory: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Read SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          const eventMatch = line.match(/^event: (.+)$/m)
          const dataMatch = line.match(/^data: (.+)$/m)

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1]
            const eventData = JSON.parse(dataMatch[1])

            handleSSEEvent(eventType, eventData)
          }
        }
      }
    } catch (error) {
      console.error('Error calling agent API:', error)

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'agent',
        content: `Erreur: Impossible de contacter l'agent. Verifiez que le serveur est lance sur ${process.env.NEXT_PUBLIC_AGENT_API_URL}`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Send command to WordPress iframe via PostMessage
   */
  const sendCommandToWordPress = (command: any) => {
    if (!iframeWindowRef.current) {
      console.error('WordPress iframe window not available')
      return
    }

    // Parse attributes if they're a JSON string (Claude sometimes sends them as strings)
    let parsedCommand = { ...command }
    if (parsedCommand.attributes && typeof parsedCommand.attributes === 'string') {
      try {
        parsedCommand.attributes = JSON.parse(parsedCommand.attributes)
        console.log('✅ Parsed attributes from JSON string to object')
      } catch (e) {
        console.error('❌ Failed to parse attributes JSON:', e)
      }
    }

    console.log('Sending command to WordPress iframe:', parsedCommand)

    iframeWindowRef.current.postMessage(
      {
        type: parsedCommand.action,
        ...parsedCommand,
      },
      wordpressUrl
    )
  }

  const handleSSEEvent = (eventType: string, data: any) => {
    const timestamp = new Date()

    switch (eventType) {
      case 'iteration_start':
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId('iter'),
            role: 'agent_action',
            content: `Iteration ${data.iteration}/${data.maxIterations}`,
            timestamp,
            icon: '⏳',
          },
        ])
        break

      case 'tool_call':
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId('tool-call'),
            role: 'agent_action',
            content: `Calling tool: ${data.toolName}`,
            timestamp,
            icon: '🔧',
          },
        ])
        break

      case 'tool_result':
        // Debug log to see what we receive
        console.log('🔍 DEBUG tool_result received:', {
          hasResult: !!data.result,
          hasCommand: !!(data.result && data.result._command),
          commandValue: data.result?._command,
          toolName: data.toolName,
          success: data.success
        })

        // Check if this is a Gutenberg command
        if (data.result && data.result._command === 'gutenberg_action') {
          console.log('✅ Gutenberg command detected:', data.result)

          // Send command to WordPress iframe
          sendCommandToWordPress(data.result)

          // Show visual feedback in chat
          setMessages((prev) => [
            ...prev,
            {
              id: generateMessageId('gutenberg'),
              role: 'agent_action',
              content: data.result.message || `Executing ${data.result.action}`,
              timestamp,
              icon: '⚡',
            },
          ])
        } else {
          // Regular tool result message
          setMessages((prev) => [
            ...prev,
            {
              id: generateMessageId('tool-result'),
              role: 'agent_action',
              content: data.success
                ? `Tool ${data.toolName} executed successfully`
                : `Tool ${data.toolName} failed: ${data.resultSummary}`,
              timestamp,
              icon: data.success ? '✅' : '❌',
            },
          ])
        }
        break

      case 'final_response':
        // Store conversation_id for subsequent requests
        if (data.conversation_id && !conversationId) {
          setConversationId(data.conversation_id)
          console.log('Conversation ID stored:', data.conversation_id)
        }

        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId('response'),
            role: 'agent',
            content: data.response,
            timestamp,
          },
        ])
        break

      case 'error':
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId('error'),
            role: 'agent',
            content: `Erreur: ${data.message}`,
            timestamp,
          },
        ])
        break
    }
  }

  const handleIframeMessage = async (data: any) => {
    console.log('🔍 DEBUG handleIframeMessage received:', {
      type: data.type,
      hasRequestId: !!data.requestId,
      requestId: data.requestId,
      keys: Object.keys(data)
    })

    // Si c'est une réponse à une requête (contient requestId), renvoyer au serveur
    if (data.requestId) {
      console.log('✅ Iframe response detected, sending to agent server:', data.type)

      try {
        // Envoyer la réponse au serveur agent via HTTP callback
        await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/agent/iframe-callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: data.requestId,
            result: data.result || data,
            success: data.result?.success !== false,
          }),
        })

        console.log('✅ Iframe callback sent to server successfully')
      } catch (error) {
        console.error('❌ Failed to send iframe callback to server:', error)
      }
    } else {
      console.log('⚠️ No requestId in message, skipping callback')
    }

    // Handle context updates from WordPress
    // This will be used later to sync agent with user's manual edits
  }

  const handleContextUpdate = (context: WordPressContext) => {
    console.log('WordPress context updated:', context)
    setWordpressContext(context)

    // Extraire le block sélectionné du contexte
    if (context.selected_block) {
      setSelectedBlock(context.selected_block)
      console.log('Block selected:', context.selected_block)
    }
  }

  const handleClearSelectedBlock = () => {
    setSelectedBlock(null)
    console.log('Block selection cleared')
  }

  const handleUrlChange = (url: string) => {
    console.log('Iframe URL changed:', url)
    setLastIframeUrl(url)
  }

  const handleNewConversation = () => {
    setConversationId(null)
    setMessages([])
    console.log('New conversation started')
  }

  /**
   * Callback when iframe window is ready
   */
  const handleIframeReady = (iframeWindow: Window) => {
    console.log('WordPress iframe window ready')
    iframeWindowRef.current = iframeWindow
  }

  /**
   * Handle tools configuration change
   */
  const handleToolsChange = (updatedTools: Tool[]) => {
    setTools(updatedTools)
    console.log('Tools configuration updated:', {
      enabled: updatedTools.filter(t => t.enabled).length,
      total: updatedTools.length
    })
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* Chat Panel - Resizable */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ChatPanel
            messages={messages}
            credits={credits}
            onSendMessage={handleSendMessage}
            onNewConversation={handleNewConversation}
            isLoading={isLoading}
            hasActiveConversation={conversationId !== null}
            selectedBlock={selectedBlock}
            onClearSelectedBlock={handleClearSelectedBlock}
            tools={tools}
            onToolsChange={handleToolsChange}
          />
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle withHandle />

        {/* WordPress Iframe - Resizable with inset styling */}
        <ResizablePanel defaultSize={75}>
          <div className="h-full w-full bg-muted/10 p-4">
            <div className="h-full w-full overflow-hidden rounded-lg border bg-background shadow-sm">
              <WordPressIframe
                wordpressUrl={wordpressUrl}
                initialUrl={lastIframeUrl}
                onMessage={handleIframeMessage}
                onContextUpdate={handleContextUpdate}
                onUrlChange={handleUrlChange}
                onIframeReady={handleIframeReady}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
