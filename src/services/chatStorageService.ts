/**
 * Chat Storage Service
 * Handles saving, loading, and managing chat conversations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CHATS_KEY = '@bunkbot_chats';
const ACTIVE_CHAT_KEY = '@bunkbot_active_chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatsState {
  chats: Chat[];
  activeChatId: string | null;
}

class ChatStorageService {
  /**
   * Get all saved chats
   */
  async getAllChats(): Promise<Chat[]> {
    try {
      const data = await AsyncStorage.getItem(CHATS_KEY);
      if (!data) return [];

      const chats: Chat[] = JSON.parse(data);
      // Convert date strings back to Date objects
      return chats.map(chat => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  }

  /**
   * Save all chats
   */
  async saveAllChats(chats: Chat[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chats:', error);
      throw error;
    }
  }

  /**
   * Get active chat ID
   */
  async getActiveChatId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_CHAT_KEY);
    } catch (error) {
      console.error('Error getting active chat:', error);
      return null;
    }
  }

  /**
   * Set active chat ID
   */
  async setActiveChatId(chatId: string | null): Promise<void> {
    try {
      if (chatId) {
        await AsyncStorage.setItem(ACTIVE_CHAT_KEY, chatId);
      } else {
        await AsyncStorage.removeItem(ACTIVE_CHAT_KEY);
      }
    } catch (error) {
      console.error('Error setting active chat:', error);
    }
  }

  /**
   * Create a new chat
   */
  async createChat(title?: string): Promise<Chat> {
    const chats = await this.getAllChats();
    const now = new Date();

    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      title: title || `Chat ${chats.length + 1}`,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    chats.unshift(newChat); // Add to beginning
    await this.saveAllChats(chats);
    await this.setActiveChatId(newChat.id);

    return newChat;
  }

  /**
   * Get a specific chat by ID
   */
  async getChat(chatId: string): Promise<Chat | null> {
    const chats = await this.getAllChats();
    return chats.find(c => c.id === chatId) || null;
  }

  /**
   * Update a chat's messages
   * Note: Images are stored but might be large - consider compression
   */
  async updateChatMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
    const chats = await this.getAllChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) return;

    // Store messages (images included as base64)
    chats[chatIndex].messages = messages;
    chats[chatIndex].updatedAt = new Date();

    // Auto-generate title from first user message if still default
    if (chats[chatIndex].title.startsWith('Chat ') && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        chats[chatIndex].title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
      }
    }

    await this.saveAllChats(chats);
  }

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, title: string): Promise<void> {
    const chats = await this.getAllChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) return;

    chats[chatIndex].title = title;
    chats[chatIndex].updatedAt = new Date();

    await this.saveAllChats(chats);
  }

  /**
   * Delete a chat
   */
  async deleteChat(chatId: string): Promise<void> {
    let chats = await this.getAllChats();
    chats = chats.filter(c => c.id !== chatId);
    await this.saveAllChats(chats);

    // If deleted chat was active, clear active chat
    const activeChatId = await this.getActiveChatId();
    if (activeChatId === chatId) {
      await this.setActiveChatId(chats.length > 0 ? chats[0].id : null);
    }
  }

  /**
   * Clear all chats
   */
  async clearAllChats(): Promise<void> {
    await AsyncStorage.removeItem(CHATS_KEY);
    await AsyncStorage.removeItem(ACTIVE_CHAT_KEY);
  }

  /**
   * Get chat summary for context (last N messages)
   */
  getChatSummary(chat: Chat, maxMessages: number = 10): string {
    const recentMessages = chat.messages.slice(-maxMessages);
    return recentMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
  }
}

export default new ChatStorageService();
