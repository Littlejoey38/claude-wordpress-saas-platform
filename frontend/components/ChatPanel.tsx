'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Send, Loader2, PlusCircle, Brain } from 'lucide-react'
import { SelectedBlockBadge } from './SelectedBlockBadge'
import { ToolsMenu, type Tool } from './ToolsMenu'
import type { SelectedBlock } from './WordPressIframe'

export interface Message {
  id: string
  role: 'user' | 'agent' | 'agent_action' | 'thinking'
  content: string
  timestamp: Date
  icon?: string // For agent actions
}

export type PermissionType = 'plan' | 'full'

interface ChatPanelProps {
  messages: Message[]
  credits: number
  onSendMessage: (message: string, permissionType: PermissionType, extendedThinking: boolean) => void
  onNewConversation: () => void
  isLoading: boolean
  hasActiveConversation: boolean
  selectedBlock?: SelectedBlock | null
  onClearSelectedBlock?: () => void
  tools: Tool[]
  onToolsChange: (tools: Tool[]) => void
}

export function ChatPanel({
  messages,
  credits,
  onSendMessage,
  onNewConversation,
  isLoading,
  hasActiveConversation,
  selectedBlock,
  onClearSelectedBlock,
  tools,
  onToolsChange
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [permissionType, setPermissionType] = useState<PermissionType>('full')
  const [extendedThinking, setExtendedThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || isLoading || credits === 0) {
      return
    }

    onSendMessage(inputValue, permissionType, extendedThinking)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full w-full flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold">Claude WordPress Agent</h2>
            <p className="text-xs text-muted-foreground">Autonomous AI assistant</p>
          </div>
          <div className="flex items-center gap-2">
            <ToolsMenu tools={tools} onToolsChange={onToolsChange} />
            <Badge variant={credits > 0 ? "default" : "destructive"}>
              {credits} credits
            </Badge>
          </div>
        </div>

        {/* New Conversation Button */}
        {hasActiveConversation && (
          <div className="px-4 pb-3">
            <Button
              onClick={onNewConversation}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle conversation
            </Button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Bienvenue! Commencez par decrire ce que vous voulez creer.
                </p>
                <p className="text-xs text-muted-foreground">
                  Exemple: &quot;Cree une page d&apos;accueil avec un hero et une section features&quot;
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'agent_action' ? (
                // Agent action message (tool calls, iterations)
                <div className="flex items-start gap-2 mb-1">
                  {message.icon && <span className="text-sm mt-0.5">{message.icon}</span>}
                  <div className="text-sm text-muted-foreground italic">
                    {message.content}
                  </div>
                </div>
              ) : message.role === 'thinking' ? (
                // Thinking message - Extended thinking content
                <div className="w-full max-w-full mb-2">
                  <div className="rounded-lg border-2 border-purple-200 bg-purple-50/50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">Extended Thinking</span>
                    </div>
                    <pre className="text-xs font-mono text-purple-900 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {message.content}
                    </pre>
                    <span className="mt-2 block text-xs text-purple-600 opacity-70">
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                // Regular user/agent message
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="mt-1 block text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg bg-muted px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">L&apos;agent reflechit...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Selected Block Badge */}
          {selectedBlock && onClearSelectedBlock && (
            <SelectedBlockBadge
              selectedBlock={selectedBlock}
              onClear={onClearSelectedBlock}
            />
          )}

          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedBlock
                ? `Modifier le block ${selectedBlock.name.split('/')[1]}...`
                : "Decrivez ce que vous voulez creer..."
            }
            className="min-h-[100px] resize-none"
            disabled={isLoading || credits === 0}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {credits === 0 ? (
                <p className="text-xs text-destructive">Credits epuises</p>
              ) : (
                <>
                  <Select value={permissionType} onValueChange={(value) => setPermissionType(value as PermissionType)}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan">Plan Mode</SelectItem>
                      <SelectItem value="full">Full Access</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="extended-thinking"
                      checked={extendedThinking}
                      onCheckedChange={setExtendedThinking}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <label
                      htmlFor="extended-thinking"
                      className="flex items-center gap-1 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <Brain className="h-3.5 w-3.5" />
                    </label>
                  </div>
                </>
              )}
            </div>
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading || credits === 0}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
