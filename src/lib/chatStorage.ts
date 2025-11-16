// Chat history management with localStorage

import { Conversation, Message } from '@/types'

const CHATS_KEY = 'gaslightgpt_chats'
const CURRENT_CHAT_KEY = 'gaslightgpt_current_chat'
const THEME_KEY = 'gaslightgpt_theme'

/**
 * Get all saved chats from localStorage
 * @returns Array of chat objects
 */
export function getAllChats(): Conversation[] {
  try {
    const chats = localStorage.getItem(CHATS_KEY)
    return chats ? JSON.parse(chats) : []
  } catch (error) {
    console.error('Error loading chats:', error)
    return []
  }
}

/**
 * Save a chat to localStorage
 * @param chat - Chat object with id, title, messages, timestamp
 */
export function saveChat(chat: Conversation): boolean {
  try {
    const chats = getAllChats()
    const existingIndex = chats.findIndex((c) => c.id === chat.id)

    if (existingIndex !== -1) {
      // Update existing chat
      chats[existingIndex] = { ...chat, updatedAt: Date.now() }
    } else {
      // Add new chat
      chats.push({ ...chat, updatedAt: Date.now() })
    }

    // Sort by updatedAt (most recent first)
    chats.sort((a, b) => b.updatedAt - a.updatedAt)

    localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
    return true
  } catch (error) {
    console.error('Error saving chat:', error)
    return false
  }
}

/**
 * Delete a chat by ID
 * @param chatId - Chat ID to delete
 */
export function deleteChat(chatId: string): boolean {
  try {
    const chats = getAllChats()
    const filtered = chats.filter((c) => c.id !== chatId)
    localStorage.setItem(CHATS_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting chat:', error)
    return false
  }
}

/**
 * Get a specific chat by ID
 * @param chatId - Chat ID to retrieve
 * @returns Chat object or null if not found
 */
export function getChatById(chatId: string): Conversation | null {
  const chats = getAllChats()
  return chats.find((c) => c.id === chatId) || null
}

/**
 * Generate a title from the first user message
 * @param messages - Array of message objects
 * @returns Generated title
 */
export function generateChatTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user')
  if (!firstUserMessage) return 'New Chat'

  // Take first 50 characters of the message
  const title = firstUserMessage.content.trim().slice(0, 50)
  return title.length < firstUserMessage.content.trim().length
    ? title + '...'
    : title
}

/**
 * Save current chat ID to localStorage
 * @param chatId - Current chat ID
 */
export function setCurrentChatId(chatId: string | null): void {
  try {
    if (chatId === null) {
      localStorage.removeItem(CURRENT_CHAT_KEY)
    } else {
      localStorage.setItem(CURRENT_CHAT_KEY, String(chatId))
    }
  } catch (error) {
    console.error('Error setting current chat ID:', error)
  }
}

/**
 * Get current chat ID from localStorage
 * @returns Current chat ID or null
 */
export function getCurrentChatId(): string | null {
  try {
    return localStorage.getItem(CURRENT_CHAT_KEY)
  } catch (error) {
    console.error('Error getting current chat ID:', error)
    return null
  }
}

/**
 * Clear all chats from localStorage
 */
export function clearAllChats(): boolean {
  try {
    localStorage.removeItem(CHATS_KEY)
    localStorage.removeItem(CURRENT_CHAT_KEY)
    return true
  } catch (error) {
    console.error('Error clearing chats:', error)
    return false
  }
}

/**
 * Get theme preference from localStorage
 * @returns 'light' or 'dark'
 */
export function getTheme(): 'light' | 'dark' {
  try {
    const theme = localStorage.getItem(THEME_KEY)
    return (theme === 'light' || theme === 'dark') ? theme : 'dark'
  } catch (error) {
    return 'dark'
  }
}

/**
 * Save theme preference to localStorage
 * @param theme - 'light' or 'dark'
 */
export function setTheme(theme: 'light' | 'dark'): boolean {
  try {
    localStorage.setItem(THEME_KEY, theme)
    return true
  } catch (error) {
    console.error('Error saving theme:', error)
    return false
  }
}

// API Provider Settings
const API_PROVIDER_KEY = 'gaslightgpt_api_provider'
const API_KEY_KEY = 'gaslightgpt_api_key'
const MODEL_KEY = 'gaslightgpt_model'

/**
 * Simple encryption for API keys (base64 encoding)
 * Note: This is NOT cryptographically secure, just basic obfuscation
 */
function encryptKey(key: string): string {
  return btoa(key)
}

/**
 * Decrypt API key (base64 decoding)
 */
function decryptKey(encrypted: string): string {
  try {
    return atob(encrypted)
  } catch {
    return encrypted // Return as-is if not base64
  }
}

/**
 * Get selected API provider from localStorage
 * @returns API provider string or 'groq' as default
 */
export function getApiProvider(): string {
  try {
    return localStorage.getItem(API_PROVIDER_KEY) || 'groq'
  } catch (error) {
    console.error('Error getting API provider:', error)
    return 'groq'
  }
}

/**
 * Save selected API provider to localStorage
 * @param provider - API provider name
 */
export function setApiProvider(provider: string): boolean {
  try {
    localStorage.setItem(API_PROVIDER_KEY, provider)
    return true
  } catch (error) {
    console.error('Error saving API provider:', error)
    return false
  }
}

/**
 * Get API key from localStorage (decrypted)
 * @returns API key or empty string if not found
 */
export function getApiKey(): string {
  try {
    const encrypted = localStorage.getItem(API_KEY_KEY)
    return encrypted ? decryptKey(encrypted) : ''
  } catch (error) {
    console.error('Error getting API key:', error)
    return ''
  }
}

/**
 * Save API key to localStorage (encrypted)
 * @param key - API key to save
 */
export function setApiKey(key: string): boolean {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_KEY, encryptKey(key))
    } else {
      localStorage.removeItem(API_KEY_KEY)
    }
    return true
  } catch (error) {
    console.error('Error saving API key:', error)
    return false
  }
}

/**
 * Clear API key from localStorage
 */
export function clearApiKey(): boolean {
  try {
    localStorage.removeItem(API_KEY_KEY)
    return true
  } catch (error) {
    console.error('Error clearing API key:', error)
    return false
  }
}

/**
 * Get selected model from localStorage
 * @returns Model string or empty string if not found
 */
export function getModel(): string {
  try {
    return localStorage.getItem(MODEL_KEY) || ''
  } catch (error) {
    console.error('Error getting model:', error)
    return ''
  }
}

/**
 * Save selected model to localStorage
 * @param model - Model name
 */
export function setModel(model: string): boolean {
  try {
    if (model.trim()) {
      localStorage.setItem(MODEL_KEY, model)
    } else {
      localStorage.removeItem(MODEL_KEY)
    }
    return true
  } catch (error) {
    console.error('Error saving model:', error)
    return false
  }
}
