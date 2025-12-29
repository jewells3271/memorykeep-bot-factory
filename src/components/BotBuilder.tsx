import React, { useState } from 'react';
import { Bot, BotModule } from '../types/Bot';
import { ModuleLibrary } from './ModuleLibrary';
import { ModuleCanvas } from './ModuleCanvas';
import { WidgetCustomizer } from './WidgetCustomizer';
import { Palette, Puzzle, Settings, Key, Copy, Check, Upload } from 'lucide-react';

interface BotBuilderProps {
  bot: Bot;
  onBotUpdate: (bot: Bot) => void;
}

export const BotBuilder: React.FC<BotBuilderProps> = ({ bot, onBotUpdate }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'widget' | 'settings' | 'api'>('modules');
  const [deployUrl, setDeployUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Publish bot config to Netlify backend
  const publishBotConfig = async () => {
    if (!bot.settings.apiBaseUrl) {
      alert('Please set the API Base URL first!');
      return;
    }

    setPublishing(true);
    setPublishStatus('idle');

    try {
      const response = await fetch(`${bot.settings.apiBaseUrl}/api/bot-config?botId=${bot.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: bot })
      });

      if (!response.ok) {
        throw new Error('Failed to publish bot config');
      }

      setPublishStatus('success');
      console.log('✅ Bot config published to backend');
      setTimeout(() => setPublishStatus('idle'), 3000);
    } catch (error) {
      console.error('Publish error:', error);
      setPublishStatus('error');
      alert('Failed to publish bot config. Make sure the backend is deployed and the API Base URL is correct.');
    } finally {
      setPublishing(false);
    }
  };

  const generateEmbedCode = (url: string) => {
    // Add embed parameter to hide the widget's internal bubble
    const embedUrl = url.includes('?') ? `${url}&embed=true` : `${url}?embed=true`;
    return `<script>
(function() {
  var btn = document.createElement('div');
  btn.innerHTML = '💬';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:${bot.widget.theme.primaryColor};border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9998;';
  
  var iframe = document.createElement('iframe');
  iframe.src = '${embedUrl}';
  iframe.style.cssText = 'position:fixed;bottom:90px;right:20px;width:380px;height:520px;border:none;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12);z-index:9999;display:none;background:white;';
  
  btn.onclick = function() {
    iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
  };
  
  document.body.appendChild(btn);
  document.body.appendChild(iframe);
})();
</script>`;
  };

  const copyEmbedCode = async () => {
    if (!deployUrl) return;
    await navigator.clipboard.writeText(generateEmbedCode(deployUrl));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModuleAdd = (moduleType: string) => {
    const newModule: BotModule = {
      id: Date.now().toString(),
      type: moduleType,
      config: {},
      position: { x: 100, y: 100 },
      enabled: true
    };

    const updatedBot = {
      ...bot,
      modules: [...bot.modules, newModule]
    };

    onBotUpdate(updatedBot);
  };

  const handleModuleUpdate = (moduleId: string, updates: Partial<BotModule>) => {
    const updatedBot = {
      ...bot,
      modules: bot.modules.map(module =>
        module.id === moduleId ? { ...module, ...updates } : module
      )
    };
    onBotUpdate(updatedBot);
  };

  const handleModuleDelete = (moduleId: string) => {
    const updatedBot = {
      ...bot,
      modules: bot.modules.filter(module => module.id !== moduleId)
    };

    onBotUpdate(updatedBot);
  };

  const handleWidgetUpdate = (widgetConfig: Bot['widget']) => {
    const updatedBot = {
      ...bot,
      widget: widgetConfig
    };

    onBotUpdate(updatedBot);
  };

  const handleBotSettingsUpdate = (updates: Partial<Bot>) => {
    const updatedBot = {
      ...bot,
      ...updates
    };

    onBotUpdate(updatedBot);
  };

  const handleApiSettingsUpdate = (settings: Bot['settings']) => {
    const updatedBot = {
      ...bot,
      settings
    };

    onBotUpdate(updatedBot);
  };

  const tabs = [
    { id: 'modules', label: 'Modules', icon: Puzzle },
    { id: 'widget', label: 'Chat Widget', icon: Palette },
    { id: 'api', label: 'AI Settings', icon: Key },
    { id: 'settings', label: 'Bot Settings', icon: Settings }
  ];

  const handleSave = () => {
    onBotUpdate(bot);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex space-x-1 px-6 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-b">
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Save Bot
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {activeTab === 'modules' && (
          <div className="flex flex-1">
            <ModuleLibrary onModuleAdd={handleModuleAdd} />
            <ModuleCanvas
              modules={bot.modules}
              onModuleUpdate={handleModuleUpdate}
              onModuleDelete={handleModuleDelete}
            />
          </div>
        )}

        {activeTab === 'widget' && (
          <div className="flex-1 overflow-y-auto">
            <WidgetCustomizer
              bot={bot}
              onWidgetUpdate={handleWidgetUpdate}
            />
          </div>
        )}

        {activeTab === 'api' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">AI & API Settings</h2>

              <div className="space-y-6">
                {/* AI Provider Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Provider
                  </label>
                  <select
                    value={bot.settings.aiProvider || 'openrouter'}
                    onChange={(e) => handleApiSettingsUpdate({
                      ...bot.settings,
                      aiProvider: e.target.value as 'openrouter' | 'gemini',
                      // Set default model when switching providers
                      model: e.target.value === 'gemini' ? 'gemini-2.0-flash' : 'anthropic/claude-3-haiku'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="openrouter">OpenRouter (Multi-Model)</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>

                {/* Gemini Settings */}
                {(bot.settings.aiProvider === 'gemini') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-blue-900">🔮 Gemini Configuration</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gemini API Key
                      </label>
                      <input
                        type="password"
                        value={bot.settings.geminiApiKey || ''}
                        onChange={(e) => handleApiSettingsUpdate({
                          ...bot.settings,
                          geminiApiKey: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="AIza..."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">Google AI Studio</a>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gemini Model
                      </label>
                      <select
                        value={bot.settings.model || 'gemini-2.0-flash'}
                        onChange={(e) => handleApiSettingsUpdate({
                          ...bot.settings,
                          model: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast & Smart)</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Most Capable)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* OpenRouter Settings */}
                {(bot.settings.aiProvider !== 'gemini') && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-purple-900">🌐 OpenRouter Configuration</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OpenRouter API Key
                      </label>
                      <input
                        type="password"
                        value={bot.settings.openRouterApiKey || ''}
                        onChange={(e) => handleApiSettingsUpdate({
                          ...bot.settings,
                          openRouterApiKey: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="sk-or-v1-..."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Get your API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">OpenRouter.ai</a>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        value={bot.settings.model || ''}
                        onChange={(e) => handleApiSettingsUpdate({
                          ...bot.settings,
                          model: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="anthropic/claude-3-haiku"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Popular models: <code>openai/gpt-4</code>, <code>anthropic/claude-3-sonnet</code>, <code>meta-llama/llama-2-70b-chat</code>
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt
                  </label>
                  <textarea
                    value={bot.settings.systemPrompt || ''}
                    onChange={(e) => handleApiSettingsUpdate({
                      ...bot.settings,
                      systemPrompt: e.target.value
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="You are a helpful assistant..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={bot.settings.temperature || 0.7}
                      onChange={(e) => handleApiSettingsUpdate({
                        ...bot.settings,
                        temperature: parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4000"
                      value={bot.settings.maxTokens || 1000}
                      onChange={(e) => handleApiSettingsUpdate({
                        ...bot.settings,
                        maxTokens: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Base URL (for deployed backend)
                  </label>
                  <input
                    type="url"
                    value={bot.settings.apiBaseUrl || ''}
                    onChange={(e) => handleApiSettingsUpdate({
                      ...bot.settings,
                      apiBaseUrl: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://your-app.netlify.app"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set this to your deployed Bot Factory URL. Exported bots will call this for AI and lead storage.
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-900 mb-2">🔒 Secure API Key Storage</h4>
                  <p className="text-sm text-indigo-800 mb-3">
                    API keys are stored securely on your deployed backend (Netlify Blobs).
                    Exported HTML files do NOT contain API keys - they call your backend API.
                  </p>
                  <button
                    onClick={publishBotConfig}
                    disabled={publishing || !bot.settings.apiBaseUrl}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${publishStatus === 'success'
                        ? 'bg-green-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {publishStatus === 'success' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Published!</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>{publishing ? 'Publishing...' : 'Publish Bot Config'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Standalone Security</h4>
                  <p className="text-sm text-yellow-800">
                    When you export your bot as HTML, the API key will be visible in the source code.
                    Consider using API keys with usage limits for production deployments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Bot Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={bot.name}
                    onChange={(e) => handleBotSettingsUpdate({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={bot.description}
                    onChange={(e) => handleBotSettingsUpdate({ description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Bot Information</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Created: {new Date(bot.createdAt).toLocaleString()}</div>
                    <div>Last Updated: {new Date(bot.updatedAt).toLocaleString()}</div>
                    <div>Modules: {bot.modules.length}</div>
                    <div>Bot ID: {bot.id}</div>
                  </div>
                </div>

                {/* Embed Code Generator */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-medium text-indigo-900 mb-3">🔗 Embed Code Generator</h3>
                  <p className="text-sm text-indigo-800 mb-3">
                    Deploy your widget to Netlify, then paste the URL below to get embed code.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={deployUrl}
                      onChange={(e) => setDeployUrl(e.target.value)}
                      placeholder="https://your-bot.netlify.app"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {deployUrl && (
                      <>
                        <div className="bg-gray-900 text-green-400 p-3 rounded-md text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                          <pre>{generateEmbedCode(deployUrl)}</pre>
                        </div>
                        <button
                          onClick={copyEmbedCode}
                          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copied ? 'Copied!' : 'Copy Embed Code'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};