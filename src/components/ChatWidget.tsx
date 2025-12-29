import React, { useState, useEffect, useRef } from 'react';
import { Bot, BotModule } from '../types/Bot';
import { MemorySystem } from '../core/MemorySystem';
import { GeminiService } from '../core/GeminiService';
import { LeadService } from '../core/LeadService';
import { LeadCaptureModule } from '../modules/LeadCapture/LeadCaptureModule';
import { X, Send } from 'lucide-react';

interface ChatWidgetProps {
  bot: Bot;
  preview?: boolean;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ bot, preview = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationMemory, setConversationMemory] = useState<Array<{ role: string, content: string }>>([]);
  const [activeLeadModule, setActiveLeadModule] = useState<BotModule | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && bot.widget.greeting.showOnOpen && messages.length === 0) {
      setMessages([{
        text: bot.widget.greeting.message,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, bot.widget.greeting.showOnOpen, bot.widget.greeting.message]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToProcess = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Process the message
      const response = await processMessage(messageToProcess);

      const botMessage: Message = {
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        text: "I'm sorry, I'm having trouble responding right now. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const processMessage = async (message: string): Promise<string> => {
    // Check for /help command (show available admin commands)
    if (message.toLowerCase().trim() === '/help') {
      return `🤖 **Admin Commands**\n\n` +
        `**/leads** - View all collected leads\n` +
        `**/exportleads** - Download leads as CSV file\n` +
        `**/help** - Show this help message\n\n` +
        `_These commands are for bot owners to manage lead data._`;
    }

    // Check for /leads command (admin command to view collected leads)
    if (message.toLowerCase().trim() === '/leads') {
      try {
        const result = await LeadService.getLeads(bot.id);
        if (result.success && result.leads) {
          return LeadService.formatLeadsForChat(result.leads);
        } else {
          return '❌ Could not retrieve leads: ' + (result.error || 'Unknown error');
        }
      } catch (error) {
        return '❌ Error retrieving leads: ' + (error as Error).message;
      }
    }

    // Check for /exportleads command (download as CSV)
    if (message.toLowerCase().trim() === '/exportleads') {
      try {
        const result = await LeadService.getLeads(bot.id);
        if (result.success && result.leads && result.leads.length > 0) {
          LeadService.downloadCSV(bot.id, result.leads);
          return `📥 **Downloading ${result.leads.length} leads as CSV...**\n\nThe file should start downloading automatically. If not, check your browser's download settings.`;
        } else if (result.leads?.length === 0) {
          return '📭 No leads to export yet.';
        } else {
          return '❌ Could not retrieve leads for export.';
        }
      } catch (error) {
        return '❌ Error exporting leads: ' + (error as Error).message;
      }
    }

    // Log user interaction to MemorySystem (Local + Cloud)
    await MemorySystem.logExperience(bot.id, {
      type: 'user_message',
      message: message,
      timestamp: new Date().toISOString(),
      source: 'chat_widget'
    });

    // Check FAQ module first
    const faqModule = bot.modules.find(m => m.type === 'faq' && m.enabled);
    if (faqModule && faqModule.config.questions) {
      const lowerMessage = message.toLowerCase();
      const match = faqModule.config.questions.find((q: any) =>
        lowerMessage.includes(q.question.toLowerCase()) ||
        q.question.toLowerCase().includes(lowerMessage)
      );
      if (match) {
        // Log FAQ interaction
        await MemorySystem.logExperience(bot.id, {
          type: 'faq_interaction',
          question: match.question,
          answer: match.answer,
          timestamp: new Date().toISOString()
        });
        return match.answer;
      }
    }

    // Check for lead capture trigger keywords
    const leadModule = bot.modules.find(m => m.type === 'lead-capture' && m.enabled);
    if (leadModule) {
      const lowerMessage = message.toLowerCase();
      const triggerKeywords: string[] = leadModule.config.triggerKeywords || ['contact', 'interested', 'demo', 'quote', 'pricing'];
      const triggered = triggerKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));

      if (triggered) {
        setActiveLeadModule(leadModule);
        setTimeout(() => scrollToBottom(), 100);
        return leadModule.config.triggerMessage || 'Please fill out the form below to get in touch with us!';
      }
    }

    // Check which AI provider to use
    const provider = bot.settings.aiProvider || 'openrouter';

    // Use Gemini if selected and API key is available
    if (provider === 'gemini' && bot.settings.geminiApiKey?.trim()) {
      try {
        const response = await callGemini(message);

        // Log AI interaction to MemorySystem
        try {
          await MemorySystem.logExperience(bot.id, {
            type: 'ai_interaction',
            provider: 'gemini',
            user_message: message,
            ai_response: response,
            model: bot.settings.model,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Failed to log to MemoryKeep Cloud:', e);
        }

        return response;
      } catch (error) {
        console.error('Gemini error:', error);
        return `I'm having trouble connecting to Gemini. ${(error as any).message}`;
      }
    }

    // Use OpenRouter if selected and API key is available
    if (provider === 'openrouter' && bot.settings.openRouterApiKey?.trim()) {
      try {
        const response = await callOpenRouter(message);

        // Log AI interaction to MemorySystem
        try {
          await MemorySystem.logExperience(bot.id, {
            type: 'ai_interaction',
            provider: 'openrouter',
            user_message: message,
            ai_response: response,
            model: bot.settings.model,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Failed to log to MemoryKeep Cloud:', e);
        }

        return response;
      } catch (error) {
        console.error('OpenRouter error:', error);
        return `I'm having trouble connecting to OpenRouter. ${(error as any).message}`;
      }
    }

    // Default response - no API configured
    return "Thanks for your message! Please configure an AI provider (Gemini or OpenRouter) in AI Settings to enable AI responses.";
  };

  const callGemini = async (message: string): Promise<string> => {
    const response = await GeminiService.chat(
      message,
      bot.settings.systemPrompt || 'You are a helpful AI assistant. Be concise, friendly, and professional.',
      conversationMemory,
      {
        apiKey: bot.settings.geminiApiKey!,
        model: bot.settings.model || 'gemini-2.0-flash',
        temperature: bot.settings.temperature,
        maxTokens: bot.settings.maxTokens
      }
    );

    // Update conversation memory
    setConversationMemory(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    ].slice(-20)); // Keep last 20 messages

    return response;
  };

  const callOpenRouter = async (message: string): Promise<string> => {
    const messages = [
      {
        role: 'system',
        content: bot.settings.systemPrompt || 'You are a helpful AI assistant. Be concise, friendly, and professional.'
      },
      ...conversationMemory,
      {
        role: 'user',
        content: message
      }
    ];

    const requestBody = {
      model: bot.settings.model || 'anthropic/claude-3-haiku',
      messages: messages,
      max_tokens: bot.settings.maxTokens || 1000,
      temperature: bot.settings.temperature || 0.7,
      stream: false
    };

    console.log('Making OpenRouter API call:', {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: requestBody.model,
      messageCount: messages.length
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bot.settings.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': bot.name || 'MemoryKeep Chat Bot'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API key in AI Settings.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 402) {
        throw new Error('Insufficient credits. Please add credits to your OpenRouter account.');
      } else {
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('OpenRouter response data:', data);

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI model');
    }

    const aiResponse = data.choices[0].message.content;

    // Update conversation memory
    setConversationMemory(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    ].slice(-20)); // Keep last 20 messages

    return aiResponse;
  };

  const getBubblePosition = () => {
    const { position } = bot.widget.bubble;
    const baseClasses = preview ? 'absolute' : 'fixed';

    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4 z-50`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4 z-50`;
      case 'top-right':
        return `${baseClasses} top-4 right-4 z-50`;
      case 'top-left':
        return `${baseClasses} top-4 left-4 z-50`;
      default:
        return `${baseClasses} bottom-4 right-4 z-50`;
    }
  };

  const getChatPosition = () => {
    const { position } = bot.widget.bubble;
    const baseClasses = preview ? 'absolute' : 'fixed';

    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-20 right-4 z-50`;
      case 'bottom-left':
        return `${baseClasses} bottom-20 left-4 z-50`;
      case 'top-right':
        return `${baseClasses} top-20 right-4 z-50`;
      case 'top-left':
        return `${baseClasses} top-20 left-4 z-50`;
      default:
        return `${baseClasses} bottom-20 right-4 z-50`;
    }
  };

  return (
    <div style={{
      fontFamily: bot.widget.theme.fontFamily,
      '--primary-color': bot.widget.theme.primaryColor,
      '--secondary-color': bot.widget.theme.secondaryColor
    } as any}>
      {/* Chat Bubble */}
      <div className={getBubblePosition()}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-110 text-xl"
          style={{ backgroundColor: bot.widget.bubble.color }}
        >
          {bot.widget.bubble.icon}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`${getChatPosition()} w-80 h-96 bg-white rounded-lg shadow-xl border flex flex-col`}>
          {/* Header */}
          <div
            className="p-4 rounded-t-lg flex items-center justify-between flex-shrink-0"
            style={{
              backgroundColor: bot.widget.header.backgroundColor,
              color: bot.widget.header.textColor
            }}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {bot.widget.header.bannerImage && bot.widget.header.showBanner && (
                <img
                  src={bot.widget.header.bannerImage}
                  alt="Banner"
                  className="h-8 w-full object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{bot.widget.header.title}</div>
                {bot.widget.header.subtitle && (
                  <div className="text-sm opacity-90 truncate">{bot.widget.header.subtitle}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:opacity-75 ml-2 flex-shrink-0 transition-opacity"
              style={{ color: bot.widget.header.textColor }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Start a conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const avatarsConfig = bot.widget.avatars;
                  const showAvatars = avatarsConfig?.showAvatars !== false;
                  const avatarConfig = message.sender === 'bot' ? avatarsConfig?.bot : avatarsConfig?.user;
                  const isEmoji = !avatarConfig || avatarConfig.type === 'emoji';
                  const avatarValue = avatarConfig?.value || (message.sender === 'bot' ? '🤖' : '👤');

                  return (
                    <div
                      key={index}
                      className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Bot avatar on left */}
                      {message.sender === 'bot' && showAvatars && (
                        <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {isEmoji ? (
                            <span className="text-sm">{avatarValue}</span>
                          ) : (
                            <img src={avatarValue} alt="Bot" className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${message.sender === 'user'
                          ? 'text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        style={message.sender === 'user' ? { backgroundColor: bot.widget.theme.primaryColor } : {}}
                      >
                        <div dangerouslySetInnerHTML={{
                          __html: message.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/\n/g, '<br>')
                        }} />
                      </div>
                      {/* User avatar on right */}
                      {message.sender === 'user' && showAvatars && (
                        <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {isEmoji ? (
                            <span className="text-sm">{avatarValue}</span>
                          ) : (
                            <img src={avatarValue} alt="User" className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    {bot.widget.avatars?.showAvatars !== false && (
                      <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(!bot.widget.avatars?.bot || bot.widget.avatars.bot.type === 'emoji') ? (
                          <span className="text-sm">{bot.widget.avatars?.bot?.value || '🤖'}</span>
                        ) : (
                          <img src={bot.widget.avatars.bot.value} alt="Bot" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                    <div className="bg-white text-gray-800 border border-gray-200 px-3 py-2 rounded-lg text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lead Capture Form */}
                {activeLeadModule && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2 shadow-sm">
                    <LeadCaptureModule
                      module={activeLeadModule}
                      botId={bot.id}
                    />
                    <button
                      onClick={() => setActiveLeadModule(null)}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Close form
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-lg flex-shrink-0">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                style={{
                  borderColor: '#e5e7eb'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = bot.widget.theme.primaryColor;
                  e.target.style.boxShadow = `0 0 0 3px ${bot.widget.theme.primaryColor}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                style={{ backgroundColor: bot.widget.theme.primaryColor }}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};