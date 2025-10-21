'use client'

import { useEffect, useRef, useState } from 'react'

export interface WordPressContext {
  current_post_id?: number
  post_title?: string
  post_status?: string
  post_type?: string
  blocks_count?: number
  current_url?: string // Add current_url to context
}

interface WordPressIframeProps {
  wordpressUrl: string
  initialUrl?: string
  onMessage?: (data: any) => void
  onContextUpdate?: (context: WordPressContext) => void
  onUrlChange?: (url: string) => void // New callback for URL changes
}

export function WordPressIframe({ wordpressUrl, initialUrl, onMessage, onContextUpdate, onUrlChange }: WordPressIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [wordpressContext, setWordpressContext] = useState<WordPressContext | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Ignore messages from our own window (Next.js Fast Refresh, etc)
      if (event.origin === window.location.origin) {
        return
      }

      // CRITICAL: Validate message origin for security
      const allowedOrigins = [
        wordpressUrl,
        process.env.NEXT_PUBLIC_WORDPRESS_URL,
      ].filter(Boolean)

      if (!allowedOrigins.some(origin => event.origin === origin)) {
        console.warn('Message from unauthorized origin:', event.origin)
        return
      }

      // Process the message
      if (event.data && event.data.type === 'context_update') {
        console.log('WordPress context update:', event.data)

        // Store context locally
        const context = event.data.data as WordPressContext
        setWordpressContext(context)

        // Save URL to localStorage if present
        if (context.current_url) {
          localStorage.setItem('lastIframeUrl', context.current_url)
          console.log('Saved URL from context_update:', context.current_url)

          // Call URL change callback
          if (onUrlChange) {
            onUrlChange(context.current_url)
          }
        }

        // Call parent callback with context
        if (onContextUpdate) {
          onContextUpdate(context)
        }

        // Also call generic message handler if provided
        onMessage?.(event.data)
      }

      // Handle URL change messages (from global admin script)
      if (event.data && event.data.type === 'url_change') {
        const url = event.data.url
        console.log('WordPress URL changed:', url)

        // Save to localStorage
        localStorage.setItem('lastIframeUrl', url)

        // Call URL change callback
        if (onUrlChange) {
          onUrlChange(url)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [wordpressUrl, onMessage, onContextUpdate])

  // Function to navigate the iframe (can be called by parent)
  const navigateIframe = (url: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'navigate',
          url: url,
        },
        wordpressUrl
      )
    }
  }

  return (
    <div className="h-full w-full">
      <iframe
        ref={iframeRef}
        src={initialUrl || `${wordpressUrl}/wp-admin`}
        className="h-full w-full border-0"
        title="WordPress Editor"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  )
}
