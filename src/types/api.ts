import { Message, ApiProvider } from './chat'

/**
 * Request payload for chat API
 */
export interface ChatRequest {
  /** Current user message */
  message: string
  /** Previous conversation history */
  history: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  /** Optional API provider to use */
  apiProvider?: ApiProvider
  /** Optional API key for the request */
  apiKey?: string
  /** Optional model to use */
  model?: string
}

/**
 * Successful response from chat API
 */
export interface ChatResponse {
  /** Assistant's reply */
  reply: string
}

/**
 * Error response from chat API
 */
export interface ChatError {
  /** Error message */
  error: string
}

/**
 * Type guard to check if response is an error
 */
export function isChatError(response: ChatResponse | ChatError): response is ChatError {
  return 'error' in response
}
