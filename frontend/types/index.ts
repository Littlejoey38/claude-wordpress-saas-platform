export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export interface AgentRequest {
  message: string
  conversationHistory: {
    role: string
    content: string
  }[]
}

export interface AgentResponse {
  response: string
  actions?: string[]
  createdPages?: {
    id: number
    title: string
    url: string
  }[]
}

export interface WordPressContext {
  current_post_id?: number
  post_title?: string
  post_status?: string
  blocks_count?: number
}
