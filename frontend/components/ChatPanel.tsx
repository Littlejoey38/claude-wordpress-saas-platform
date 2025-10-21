'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, PlusCircle } from 'lucide-react'

export interface Message {
  id: string
  role: 'user' | 'agent' | 'agent_action'
  content: string
  timestamp: Date
  icon?: string // For agent actions
}

interface ChatPanelProps {
  messages: Message[]
  credits: number
  onSendMessage: (message: string) => void
  onNewConversation: () => void
  isLoading: boolean
  hasActiveConversation: boolean
}

export function ChatPanel({
  messages,
  credits,
  onSendMessage,
  onNewConversation,
  isLoading,
  hasActiveConversation
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
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

    onSendMessage(inputValue)
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
          <Badge variant={credits > 0 ? "default" : "destructive"}>
            {credits} credits
          </Badge>
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
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Decrivez ce que vous voulez creer..."
            className="min-h-[100px] resize-none"
            disabled={isLoading || credits === 0}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {credits === 0 ? (
                <span className="text-destructive">Credits epuises</span>
              ) : (
                'Shift + Enter pour nouvelle ligne'
              )}
            </p>
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
