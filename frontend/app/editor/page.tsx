'use client'

import { useState, useEffect } from 'react'
import { ChatPanel, type Message } from '@/components/ChatPanel'
import { WordPressIframe, type WordPressContext } from '@/components/WordPressIframe'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

export default function EditorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [credits, setCredits] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const [wordpressContext, setWordpressContext] = useState<WordPressContext | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

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

  const handleSendMessage = async (messageContent: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
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
            conversation_id: conversationId, // IMPORTANT: Send conversation ID if exists
            wordpress_context: wordpressContext, // Include WordPress context
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

  const handleSSEEvent = (eventType: string, data: any) => {
    const timestamp = new Date()

    switch (eventType) {
      case 'iteration_start':
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-iter`,
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
            id: `${Date.now()}-tool-call`,
            role: 'agent_action',
            content: `Calling tool: ${data.toolName}`,
            timestamp,
            icon: '🔧',
          },
        ])
        break

      case 'tool_result':
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-tool-result`,
            role: 'agent_action',
            content: data.success
              ? `Tool ${data.toolName} executed successfully`
              : `Tool ${data.toolName} failed: ${data.resultSummary}`,
            timestamp,
            icon: data.success ? '✅' : '❌',
          },
        ])
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
            id: `${Date.now()}-response`,
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
            id: `${Date.now()}-error`,
            role: 'agent',
            content: `Erreur: ${data.message}`,
            timestamp,
          },
        ])
        break
    }
  }

  const handleIframeMessage = (data: any) => {
    console.log('Received message from WordPress iframe:', data)
    // Handle context updates from WordPress
    // This will be used later to sync agent with user's manual edits
  }

  const handleContextUpdate = (context: WordPressContext) => {
    console.log('WordPress context updated:', context)
    setWordpressContext(context)
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
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
