import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Bot } from '../types/Bot';
import { Memory } from '../types/Memory';

const DB_NAME = 'MemoryKeepDB';
const DB_VERSION = 1;
const BOTS_STORE = 'bots';
const MEMORIES_STORE = 'memories';

interface MemoryKeepDB extends DBSchema {
  [BOTS_STORE]: {
    key: string;
    value: Bot;
    indexes: { 'by-updatedAt': string };
  };
  [MEMORIES_STORE]: {
    key: string;
    value: Memory;
    indexes: { 'by-botId-type': [string, string] };
  };
}

let dbPromise: Promise<IDBPDatabase<MemoryKeepDB>>;

const initDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB<MemoryKeepDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
      
      if (!db.objectStoreNames.contains(BOTS_STORE)) {
        const botStore = db.createObjectStore(BOTS_STORE, { keyPath: 'id' });
        botStore.createIndex('by-updatedAt', 'updatedAt');
        console.log('Created bots object store');
      }

      if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
        const memoryStore = db.createObjectStore(MEMORIES_STORE, { keyPath: 'id' });
        memoryStore.createIndex('by-botId-type', ['botId', 'type']);
        console.log('Created memories object store');
      }
    },
  });

  return dbPromise;
};

export const getDB = (): Promise<IDBPDatabase<MemoryKeepDB>> => {
    return initDB();
};