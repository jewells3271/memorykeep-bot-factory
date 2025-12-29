import { getDB } from './db';

export class MemoryKeepCloud {
  private static readonly API_BASE = 'https://memorykeep.cloud/api';

  // Default fallback API key
  private static readonly FALLBACK_API_KEY = 'anny-5555';

  private static async getBotApiKey(botId: string): Promise<string> {
    // Get the bot's custom API key from IndexedDB
    try {
      const db = await getDB();
      const bot = await db.get('bots', botId);
      if (bot?.settings?.memoryKeepApiKey) {
        return bot.settings.memoryKeepApiKey.trim();
      }
    } catch (error) {
      console.warn('Could not retrieve bot API key from IndexedDB:', error);
    }

    return this.FALLBACK_API_KEY;
  }

  static async logMemory(botId: string, type: 'core' | 'experience' | 'notebook' | 'job', entry: any, customApiKey?: string): Promise<{ success: boolean; status?: number; message?: string }> {
    try {
      const key = customApiKey || await this.getBotApiKey(botId);
      const response = await fetch(`${this.API_BASE}/log-memory`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          entry: typeof entry === 'string' ? entry : entry
        }),
        mode: 'cors'
      });

      if (!response.ok) {
        // Cloud API error - fail silently
        return { success: false, status: response.status, message: await response.text() };
      }

      console.log(`✅ Logged to MemoryKeep [${type}]:`, entry);
      return { success: true };
    } catch (error: any) {
      // Cloud is likely down - fail silently
      return { success: false, message: error.message };
    }
  }

  static async getMemory(botId: string, type: 'core' | 'experience' | 'notebook' | 'job', customApiKey?: string): Promise<any> {
    try {
      const key = customApiKey || await this.getBotApiKey(botId);
      const response = await fetch(`${this.API_BASE}/get-memory?type=${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`
        },
        mode: 'cors'
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No memory found
        }
        console.error('MemoryKeep get failed:', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      console.log(`📖 Retrieved from MemoryKeep [${type}]:`, data.memory);
      return data.memory;
    } catch (error) {
      // Cloud is likely down - fail silently
      return null;
    }
  }

  static async overwriteMemory(botId: string, type: 'core' | 'experience' | 'notebook' | 'job', entry: any, customApiKey?: string): Promise<boolean> {
    try {
      const key = customApiKey || await this.getBotApiKey(botId);
      const response = await fetch(`${this.API_BASE}/overwrite-memory`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          entry
        }),
        mode: 'cors'
      });

      if (!response.ok) {
        // Cloud API error - fail silently
        return false;
      }

      console.log(`🔄 Overwrote MemoryKeep [${type}]:`, entry);
      return true;
    } catch (error) {
      // Cloud is likely down - fail silently
      return false;
    }
  }

  // Helper methods for specific memory types
  static async logExperience(botId: string, experience: string | object, customApiKey?: string): Promise<boolean> {
    const result = await this.logMemory(botId, 'experience', experience, customApiKey);
    return result.success;
  }

  static async updateCore(botId: string, coreData: object, customApiKey?: string): Promise<boolean> {
    return this.overwriteMemory(botId, 'core', coreData, customApiKey);
  }

  static async addNotebookEntry(botId: string, entry: string | object, customApiKey?: string): Promise<boolean> {
    const result = await this.logMemory(botId, 'notebook', entry, customApiKey);
    return result.success;
  }

  static async addJobEntry(botId: string, job: object, customApiKey?: string): Promise<boolean> {
    const result = await this.logMemory(botId, 'job', job, customApiKey);
    return result.success;
  }

  // Get all memories for a bot
  static async getAllMemories(botId: string, customApiKey?: string): Promise<Record<string, any>> {
    const memories: Record<string, any> = {};
    const types: Array<'core' | 'experience' | 'notebook' | 'job'> = ['core', 'experience', 'notebook', 'job'];

    for (const type of types) {
      memories[type] = await this.getMemory(botId, type, customApiKey);
    }

    return memories;
  }

  // Test connection with a bot's API key
  static async testConnection(botId: string): Promise<{ success: boolean; message: string }> {
    const result = await this.logMemory(botId, 'core', { status: 'connection_test', timestamp: new Date().toISOString() });
    const apiKey = await this.getBotApiKey(botId);

    if (result.success) {
      return {
        success: true,
        message: `✅ Connected to MemoryKeep Cloud with API key: ${apiKey}`
      };
    } else if (result.status === 403) {
      return {
        success: false,
        message: `❌ API key not whitelisted: ${apiKey}`
      };
    } else {
      return {
        success: false,
        message: `❌ Connection failed: ${result.message || `Status ${result.status}`}`
      };
    }
  }
}