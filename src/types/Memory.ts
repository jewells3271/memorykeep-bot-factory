export interface Memory {
  id: string;
  type: 'core' | 'experience' | 'notebook' | 'job';
  content: any;
  timestamp: string;
  botId: string;
}

export interface MemoryEntry {
  id: string;
  content: string | object;
  timestamp: string;
  type?: string;
}