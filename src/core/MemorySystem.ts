import { Bot } from '../types/Bot';
import { Memory } from '../types/Memory';
import { getDB } from './db';

export class MemorySystem {
  private static readonly STORAGE_PREFIX = 'memorykeep';
  private static readonly BOTS_KEY = `${this.STORAGE_PREFIX}_bots`;
  private static readonly MEMORY_KEY = `${this.STORAGE_PREFIX}_memory`;

  private static getDefaultWidget(): Bot['widget'] {
    return {
      header: {
        title: 'Chat Support',
        subtitle: 'We\'re here to help!',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        bannerImage: undefined,
        showBanner: false
      },
      greeting: {
        message: 'Hello! How can I help you today?',
        showOnOpen: true
      },
      bubble: {
        color: '#3b82f6',
        icon: '💬',
        position: 'bottom-right'
      },
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        fontFamily: 'Inter, sans-serif'
      },
      avatars: {
        bot: { type: 'emoji', value: '🤖' },
        user: { type: 'emoji', value: '👤' },
        showAvatars: true
      }
    };
  }

  private static getDefaultSettings(): Bot['settings'] {
    return {
      isActive: true,
      allowedDomains: [],
      rateLimiting: {
        enabled: false,
        maxRequests: 100,
        timeWindow: 3600
      },
      analytics: {
        enabled: true,
        trackConversations: true,
        trackUserActions: true
      }
    };
  }

  private static normalizeBot(bot: Partial<Bot>): Bot {
    const defaultWidget = this.getDefaultWidget();
    const defaultSettings = this.getDefaultSettings();

    return {
      id: bot.id || Date.now().toString(),
      name: bot.name || 'Untitled Bot',
      description: bot.description || '',
      modules: bot.modules || [],
      widget: {
        header: {
          ...defaultWidget.header,
          ...(bot.widget?.header || {})
        },
        greeting: {
          ...defaultWidget.greeting,
          ...(bot.widget?.greeting || {})
        },
        bubble: {
          ...defaultWidget.bubble,
          ...(bot.widget?.bubble || {})
        },
        theme: {
          ...defaultWidget.theme,
          ...(bot.widget?.theme || {})
        },
        avatars: {
          ...defaultWidget.avatars,
          ...(bot.widget?.avatars || {})
        }
      },
      settings: {
        ...defaultSettings,
        ...(bot.settings || {}),
        rateLimiting: {
          ...defaultSettings.rateLimiting!,
          ...(bot.settings?.rateLimiting || {})
        },
        analytics: {
          ...defaultSettings.analytics!,
          ...(bot.settings?.analytics || {})
        }
      },
      createdAt: bot.createdAt || new Date().toISOString(),
      updatedAt: bot.updatedAt || new Date().toISOString()
    };
  }

  static async saveBot(bot: Bot): Promise<void> {
    const db = await getDB();
    const normalizedBot = this.normalizeBot({
      ...bot,
      updatedAt: new Date().toISOString(),
    });

    try {
      await db.put('bots', normalizedBot);
      console.log('Bot saved locally to IndexedDB');
    } catch (error) {
      console.error('Failed to save bot to IndexedDB:', error);
      throw error;
    }
  }

  static async getAllBots(): Promise<Bot[]> {
    const db = await getDB();
    try {
      const bots = await db.getAllFromIndex('bots', 'by-updatedAt');
      return bots.map((bot: Partial<Bot>) => this.normalizeBot(bot)).reverse(); // Show most recently updated first
    } catch (error) {
      console.error('Failed to load bots from IndexedDB:', error);
      return [];
    }
  }

  static async getBot(id: string): Promise<Bot | null> {
    const db = await getDB();
    try {
      const bot = await db.get('bots', id);
      return bot ? this.normalizeBot(bot) : null;
    } catch (error) {
      console.error('Failed to get bot from IndexedDB:', error);
      return null;
    }
  }

  static async deleteBot(id: string): Promise<void> {
    const db = await getDB();
    try {
      await db.delete('bots', id);
      // Also delete associated memories
      await this.deleteAllMemories(id);
      console.log(`Bot ${id} deleted from IndexedDB.`);
      // Note: Deletion in the cloud is not handled here, would need a cloud API endpoint
    } catch (error) {
      console.error('Failed to delete bot from IndexedDB:', error);
      throw error;
    }
  }

  static async saveMemory(botId: string, type: string, content: any): Promise<void> {
    const db = await getDB();
    const memory: Memory = {
      id: `${botId}-${type}-${Date.now()}`,
      type: type as any,
      content,
      timestamp: new Date().toISOString(),
      botId
    };

    try {
      await db.put('memories', memory);
      console.log(`Memory [${type}] saved locally to IndexedDB`);
    } catch (error) {
      console.error('Failed to save memory to IndexedDB:', error);
      throw error;
    }
  }

  static async getMemories(botId: string, type: string): Promise<Memory[]> {
    const db = await getDB();
    try {
      return await db.getAllFromIndex('memories', 'by-botId-type', [botId, type]);
    } catch (error) {
      console.error(`Failed to get memories [${type}] from IndexedDB:`, error);
      return [];
    }
  }

  static async getAllMemories(botId: string): Promise<Record<string, Memory[]>> {
    try {
      const types = ['core', 'experience', 'notebook'];
      const memories: Record<string, Memory[]> = {};

      for (const type of types) {
        memories[type] = await this.getMemories(botId, type);
      }

      return memories;
    } catch (error) {
      console.error('Failed to get all memories from IndexedDB:', error);
      return {};
    }
  }

  static async overwriteMemory(botId: string, type: string, content: any): Promise<void> {
    const db = await getDB();
    // First, delete all existing memories of this type for this bot
    const existing = await db.getAllFromIndex('memories', 'by-botId-type', [botId, type]);
    const tx = db.transaction('memories', 'readwrite');
    await Promise.all([...existing.map((mem: Memory) => tx.store.delete(mem.id)), tx.done]);

    // Now, save the new content as a single memory entry
    await this.saveMemory(botId, type, content);
  }

  static async deleteAllMemories(botId: string): Promise<void> {
    const db = await getDB();
    try {
      const memoriesToDelete = await db.getAllFromIndex('memories', 'by-botId-type', IDBKeyRange.bound([botId, ''], [botId, '\uffff']));
      const tx = db.transaction('memories', 'readwrite');
      await Promise.all([...memoriesToDelete.map((mem: Memory) => tx.store.delete(mem.id)), tx.done]);
      console.log(`Deleted all memories for bot ${botId} from IndexedDB.`);
    } catch (error) {
      console.error(`Failed to delete memories for bot ${botId}:`, error);
      throw error;
    }
  }

  static async logExperience(botId: string, experience: string | object): Promise<void> {
    await this.saveMemory(botId, 'experience', experience);
  }

  static async updateCore(botId: string, coreData: object): Promise<void> {
    await this.overwriteMemory(botId, 'core', coreData);
  }

  static async addNotebookEntry(botId: string, entry: string | object): Promise<void> {
    await this.saveMemory(botId, 'notebook', entry);
  }

  static async addJobEntry(botId: string, job: object): Promise<void> {
    // Jobs stored locally - cloud sync removed
    await this.saveMemory(botId, 'job', job);
  }

  static async migrateFromLocalStorage(): Promise<void> {
    console.log('Checking for data to migrate from localStorage...');
    const migrationFlag = 'memorykeep_migrated_to_idb';
    if (localStorage.getItem(migrationFlag)) {
      console.log('Migration already performed. Skipping.');
      return;
    }

    const db = await getDB();

    // Migrate Bots
    const oldBotsData = localStorage.getItem(this.BOTS_KEY);
    if (oldBotsData) {
      try {
        const bots: Bot[] = JSON.parse(oldBotsData);
        const tx = db.transaction('bots', 'readwrite');
        await Promise.all([...bots.map(bot => tx.store.put(this.normalizeBot(bot))), tx.done]);
        console.log(`Migrated ${bots.length} bots to IndexedDB.`);
        localStorage.removeItem(this.BOTS_KEY);
      } catch (e) {
        console.error('Failed to migrate bots:', e);
      }
    }

    // Migrate Memories
    // This is more complex as they are stored in separate keys.
    // We can find them by looking for keys with the memory prefix.
    const memoryKeys = Object.keys(localStorage).filter(k => k.startsWith(this.MEMORY_KEY));
    if (memoryKeys.length > 0) {
      const tx = db.transaction('memories', 'readwrite');
      let memoryCount = 0;
      const promises = [];
      for (const key of memoryKeys) {
        try {
          const memories: Memory[] = JSON.parse(localStorage.getItem(key) || '[]');
          for (const memory of memories) {
            promises.push(tx.store.put(memory));
            memoryCount++;
          }
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to migrate memories from key ${key}:`, e);
        }
      }
      await Promise.all([...promises, tx.done]);
      console.log(`Migrated ${memoryCount} memory entries to IndexedDB.`);
    }

    localStorage.setItem(migrationFlag, 'true');
    console.log('LocalStorage to IndexedDB migration complete.');
  }
}