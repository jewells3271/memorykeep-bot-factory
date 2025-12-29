import React, { useState, useEffect } from 'react';
import { MemorySystem } from '../core/MemorySystem';
import { Memory } from '../types/Memory';
import { Database, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';

interface MemoryViewerProps {
  botId: string;
}

export const MemoryViewer: React.FC<MemoryViewerProps> = ({ botId }) => {
  const [activeType, setActiveType] = useState<'core' | 'experience' | 'notebook' | 'job'>('core');
  const [memories, setMemories] = useState<Record<string, Memory[]>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [newEntry, setNewEntry] = useState('');

  useEffect(() => {
    loadMemories();
  }, [botId]);

  const loadMemories = async () => {
    try {
      const allMemories = await MemorySystem.getAllMemories(botId);
      setMemories(allMemories);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  const handleEditMemory = (content: any) => {
    setEditContent(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    setIsEditing(true);
  };

  const handleSaveMemory = async () => {
    try {
      let parsedContent;
      try {
        parsedContent = JSON.parse(editContent);
      } catch {
        parsedContent = editContent;
      }

      await MemorySystem.overwriteMemory(botId, activeType, parsedContent);
      setIsEditing(false);
      setEditContent('');
      loadMemories();
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.trim()) return;

    try {
      let parsedContent;
      try {
        parsedContent = JSON.parse(newEntry);
      } catch {
        parsedContent = newEntry;
      }

      await MemorySystem.saveMemory(botId, activeType, parsedContent);
      setNewEntry('');
      loadMemories();
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  const handleDeleteMemory = async (type: string) => {
    if (window.confirm(`Are you sure you want to delete all ${type} memories?`)) {
      try {
        await MemorySystem.overwriteMemory(botId, type, []);
        loadMemories();
      } catch (error) {
        console.error('Failed to delete memories:', error);
      }
    }
  };

  const memoryTypes = [
    { key: 'core', label: 'Core', description: 'Bot personality and core settings' },
    { key: 'experience', label: 'Experience', description: 'Learning and interaction history' },
    { key: 'notebook', label: 'Notebook', description: 'Notes and custom data' },
    { key: 'job', label: 'Jobs', description: 'Automation tasks and scheduled jobs' }
  ];

  const currentMemories = memories[activeType] || [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Memory Viewer</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-blue-800">
            <strong>Local Storage:</strong> All memories are stored in your browser's IndexedDB.
          </p>
        </div>

        <div className="flex space-x-1">
          {memoryTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setActiveType(type.key as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeType === type.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">
              {memoryTypes.find(t => t.key === activeType)?.label} Memory
            </h3>
            <button
              onClick={() => handleDeleteMemory(activeType)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {memoryTypes.find(t => t.key === activeType)?.description}
          </p>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="Enter memory content (JSON or text)"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveMemory}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentMemories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No {activeType} memories yet</p>
              </div>
            ) : (
              currentMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {new Date(memory.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleEditMemory(memory.content)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-900 font-mono whitespace-pre-wrap">
                    {typeof memory.content === 'string'
                      ? memory.content
                      : JSON.stringify(memory.content, null, 2)}
                  </div>
                </div>
              ))
            )}

            {/* Add new entry */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <textarea
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder={`Add new ${activeType} memory...`}
                />
                <button
                  onClick={handleAddEntry}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Entry</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};