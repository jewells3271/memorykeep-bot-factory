import React, { useState } from 'react';
import { Bot } from '../types/Bot';
import { MemorySystem } from '../core/MemorySystem';
import { Settings, Trash2, Copy, Edit2 } from 'lucide-react';

interface BotListProps {
  bots: Bot[];
  activeBot: Bot | null;
  onBotSelect: (bot: Bot) => void;
  onBotUpdate: (bot: Bot) => void;
}

export const BotList: React.FC<BotListProps> = ({
  bots,
  activeBot,
  onBotSelect,
  onBotUpdate
}) => {
  const [editingBot, setEditingBot] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleEdit = (bot: Bot) => {
    setEditingBot(bot.id);
    setEditName(bot.name);
  };

  const handleSaveEdit = async (bot: Bot) => {
    if (editName.trim()) {
      const updatedBot = { ...bot, name: editName.trim() };
      await MemorySystem.saveBot(updatedBot);
      onBotUpdate(updatedBot);
    }
    setEditingBot(null);
  };

  const handleCancelEdit = () => {
    setEditingBot(null);
    setEditName('');
  };

  const handleDelete = async (bot: Bot) => {
    if (window.confirm(`Are you sure you want to delete "${bot.name}"?`)) {
      await MemorySystem.deleteBot(bot.id);
      window.location.reload(); // Simple refresh to update the list
    }
  };

  const handleDuplicate = async (bot: Bot) => {
    const duplicatedBot: Bot = {
      ...bot,
      id: Date.now().toString(),
      name: `${bot.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await MemorySystem.saveBot(duplicatedBot);
    onBotUpdate(duplicatedBot);
  };

  return (
    <div className="p-4 space-y-3">
      {bots.map((bot) => (
        <div
          key={bot.id}
          className={`p-3 rounded-lg border-2 transition-all cursor-pointer group ${
            activeBot?.id === bot.id
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
          onClick={() => !editingBot && onBotSelect(bot)}
        >
          <div className="flex items-center justify-between">
            {editingBot === bot.id ? (
              <div className="flex-1 mr-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onBlur={() => handleSaveEdit(bot)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(bot)}
                  onKeyDown={(e) => e.key === 'Escape' && handleCancelEdit()}
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{bot.name}</h3>
                <p className="text-sm text-gray-500 truncate">{bot.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400">{bot.modules.length} modules</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    {new Date(bot.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
            
            {editingBot !== bot.id && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(bot);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(bot);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bot);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {bots.length === 0 && (
        <div className="text-center py-8">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bots yet. Create your first bot to get started!</p>
        </div>
      )}
    </div>
  );
};