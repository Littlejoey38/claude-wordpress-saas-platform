import type { AgentRequest, AgentResponse } from '@/types'

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3000'

export async function sendMessageToAgent(
  message: string,
  conversationHistory: { role: string; content: string }[]
): Promise<AgentResponse> {
  const request: AgentRequest = {
    message,
    conversationHistory,
  }

  const response = await fetch(`${AGENT_API_URL}/agent/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Agent API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export class AgentAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message)
    this.name = 'AgentAPIError'
  }
}
