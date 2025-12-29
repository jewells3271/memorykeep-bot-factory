import React, { useState, useEffect } from 'react';
import { Bot } from '../types/Bot';
import { BotBuilder } from './BotBuilder';
import { BotList } from './BotList';
import { MemoryViewer } from './MemoryViewer';
import { MemorySystem } from '../core/MemorySystem';
import { Plus } from 'lucide-react';

interface BotFactoryProps {
  activeBot: Bot | null;
  bots: Bot[];
  onBotUpdate: (bot: Bot) => void;
  onBotSelect: (bot: Bot) => void;
  showMemoryViewer: boolean;
}

export const BotFactory: React.FC<BotFactoryProps> = ({
  activeBot,
  bots,
  onBotUpdate,
  onBotSelect,
  showMemoryViewer
}) => {
  const [showBotList, setShowBotList] = useState(false);

  const handleCreateBot = async () => {
    const newBot: Bot = {
      id: Date.now().toString(),
      name: `Bot ${bots.length + 1}`,
      description: 'A new bot ready to be configured',
      modules: [],
      widget: {
        header: {
          title: 'Chat Support',
          subtitle: 'We\'re here to help!',
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
          showBanner: false
        },
        greeting: {
          message: 'Hello! How can I help you today?',
          showOnOpen: true
        },
        bubble: {
          color: '#3B82F6',
          icon: '💬',
          position: 'bottom-right'
        },
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          fontFamily: 'Inter, sans-serif'
        },
        avatars: {
          bot: { type: 'emoji', value: '🤖' },
          user: { type: 'emoji', value: '👤' },
          showAvatars: true
        }
      },
      settings: {
        model: 'openai/gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a helpful assistant.',
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
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await MemorySystem.saveBot(newBot);
    onBotUpdate(newBot);
    setShowBotList(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Bots</h2>
            <button
              onClick={handleCreateBot}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4" />
              <span>New Bot</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <BotList
            bots={bots}
            activeBot={activeBot}
            onBotSelect={onBotSelect}
            onBotUpdate={onBotUpdate}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeBot ? (
          <BotBuilder
            bot={activeBot}
            onBotUpdate={onBotUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bot Selected</h3>
              <p className="text-gray-500 mb-4">Create a new bot or select an existing one to get started</p>
              <button
                onClick={handleCreateBot}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Bot</span>
              </button>
            </div>
          </div>
        )}

        {/* Memory Viewer */}
        {showMemoryViewer && activeBot && (
          <div className="w-96 bg-white shadow-lg border-l">
            <MemoryViewer botId={activeBot.id} />
          </div>
        )}
      </div>
    </div>
  );
};