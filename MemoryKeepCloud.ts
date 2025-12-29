import { getDB } from './db';

// MemoryKeep Cloud API is DISABLED - all methods are no-ops
// This file is kept for backwards compatibility but does NOT make any network requests

export class MemoryKeepCloud {
  // DISABLED - Cloud service no longer exists
  private static readonly DISABLED = true;

  private static async getBotApiKey(botId: string): Promise<string> {
    return '';
  }

  static async logMemory(botId: string, type: 'core' | 'experience' | 'notebook' | 'job', entry: any, customApiKey?: string): Promise<{ success: boolean; status?: number; message?: string }> {
    // DISABLED - no network call
    return { success: false, message: 'MemoryKeep Cloud is disabled' };
  }

  static async getMemory(botId: string, type: 'core' | 'experience' | 'notebook' | 'job', customApiKey?: string): Promise<any> {
    // DISABLED - no network call
    return null;
  }

  static async overwriteMemory(botId: string, type: 'core' | 'experience' | 'notebook' | 'job', entry: any, customApiKey?: string): Promise<boolean> {
    // DISABLED - no network call
    return false;
  }

  // Helper methods for specific memory types - all disabled
  static async logExperience(botId: string, experience: string | object, customApiKey?: string): Promise<boolean> {
    return false;
  }

  static async updateCore(botId: string, coreData: object, customApiKey?: string): Promise<boolean> {
    return false;
  }

  static async addNotebookEntry(botId: string, entry: string | object, customApiKey?: string): Promise<boolean> {
    return false;
  }

  static async addJobEntry(botId: string, job: object, customApiKey?: string): Promise<boolean> {
    return false;
  }

  // Get all memories for a bot - returns empty
  static async getAllMemories(botId: string, customApiKey?: string): Promise<Record<string, any>> {
    return {};
  }

  // Test connection - always fails since service is disabled
  static async testConnection(botId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: '❌ MemoryKeep Cloud is disabled. All memory is stored locally in IndexedDB.'
    };
  }
}