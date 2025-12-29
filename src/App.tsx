import React, { useState, useEffect } from 'react';
import { BotFactory } from './components/BotFactory';
import { ChatWidget } from './components/ChatWidget';
import { MemorySystem } from './core/MemorySystem';
import { Bot } from './types/Bot';
import { Play, Settings, Download, Upload, ExternalLink } from 'lucide-react';

function App() {
  const [activeBot, setActiveBot] = useState<Bot | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMemoryViewer, setShowMemoryViewer] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      await MemorySystem.migrateFromLocalStorage();
      loadBots();
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // This is a good place to check for unsaved changes
      // For now, we don't have a specific check, but this is where it would go.
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeBot]);

  const loadBots = async () => {
    try {
      const savedBots = await MemorySystem.getAllBots();
      setBots(savedBots);
      if (savedBots.length > 0 && !activeBot) {
        setActiveBot(savedBots[0]);
      }
    } catch (error) {
      console.error('Failed to load bots:', error);
    }
  };

  const handleBotUpdate = async (updatedBot: Bot) => {
    try {
      await MemorySystem.saveBot(updatedBot);
      setActiveBot(updatedBot);
      loadBots();
    } catch (error) {
      console.error('Failed to save bot:', error);
    }
  };

  const handleExportBot = async () => {
    if (!activeBot) return;

    const exportData = {
      bot: activeBot,
      memories: await MemorySystem.getAllMemories(activeBot.id),
      exportedAt: new Date().toISOString(),
      version: '2.0',
      standalone: true,
      runtime: {
        memorySystem: 'localStorage',
        apiEndpoint: activeBot.settings.openRouterApiKey ? 'https://openrouter.ai/api/v1' : null
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBot.name.replace(/\s+/g, '-')}-standalone.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportStandalone = async () => {
    if (!activeBot) return;

    const standaloneHTML = await generateStandaloneHTML(activeBot);
    const filename = `${activeBot.name.replace(/\s+/g, '-')}-widget.html`;

    // Try modern File System Access API first (shows Save As dialog)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'HTML Files',
            accept: { 'text/html': ['.html'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(standaloneHTML);
        await writable.close();
        alert('File saved successfully!');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled
        console.error('Save picker failed:', err);
      }
    }

    // Fallback: copy to clipboard with instructions
    try {
      await navigator.clipboard.writeText(standaloneHTML);
      alert(`HTML copied to clipboard!\n\nTo save:\n1. Open Notepad\n2. Paste (Ctrl+V)\n3. File > Save As\n4. Name: ${filename}\n5. Save as type: All Files (*.*)`);
    } catch (err) {
      console.error('Clipboard failed:', err);
      alert('Export failed. Please try a different browser.');
    }
  };

  const generateStandaloneHTML = async (bot: Bot): Promise<string> => {
    const memories = await MemorySystem.getAllMemories(bot.id);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bot.name} - Chat Widget</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: '${bot.widget.theme.fontFamily}', sans-serif; }
        :root { --primary-color: ${bot.widget.theme.primaryColor}; --secondary-color: ${bot.widget.theme.secondaryColor}; }
        
        .chat-bubble { position: fixed; z-index: 1000; width: 60px; height: 60px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s; font-size: 24px; }
        .chat-bubble:hover { transform: scale(1.1); }
        
        .chat-window { position: fixed; z-index: 1001; width: 350px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); display: none; flex-direction: column; }
        
        /* Embedded Mode Styles */
        body.embedded .chat-bubble { display: none !important; }
        body.embedded .chat-window { 
            display: flex !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            border-radius: 0;
            box-shadow: none;
            z-index: 1000;
        }
        body.embedded .close-button { display: none !important; }

        .chat-header { background: ${bot.widget.header.backgroundColor}; color: ${bot.widget.header.textColor}; padding: 16px; border-radius: 12px 12px 0 0; display: flex; align-items: center; justify-content: space-between; }
        body.embedded .chat-header { border-radius: 0; }
        
        .chat-header-content { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .chat-header img { height: 32px; width: auto; border-radius: 4px; }
        .chat-header-text { flex: 1; min-width: 0; }
        .chat-header-title { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-header-subtitle { font-size: 12px; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .close-button { background: none; border: none; color: inherit; font-size: 20px; cursor: pointer; padding: 4px; margin-left: 8px; flex-shrink: 0; }
        .chat-messages { flex: 1; padding: 16px; overflow-y: auto; background: #f8fafc; min-height: 0; }
        .message { margin-bottom: 12px; display: flex; flex-direction: column; }
        .user-message { align-items: flex-end; }
        .bot-message { align-items: flex-start; }
        .message-content { max-width: 80%; padding: 10px 14px; border-radius: 18px; font-size: 14px; line-height: 1.4; word-wrap: break-word; }
        .user-message .message-content { background: var(--primary-color); color: white; }
        .bot-message .message-content { background: white; color: #374151; border: 1px solid #e5e7eb; }
        .chat-input-container { padding: 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; flex-shrink: 0; }
        .chat-input { flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 20px; outline: none; font-size: 14px; }
        .chat-input:focus { border-color: var(--primary-color); }
        .send-button { background: var(--primary-color); color: white; border: none; border-radius: 20px; padding: 10px 16px; cursor: pointer; font-size: 14px; }
        .send-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .typing-indicator { display: none; padding: 8px 16px; color: #6b7280; font-size: 12px; font-style: italic; }
        .typing-dots { display: flex; gap: 4px; margin-bottom: 8px; }
        .typing-dot { width: 6px; height: 6px; background: #6b7280; border-radius: 50%; animation: typing 1.4s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-10px); opacity: 1; } }
        .bottom-right { bottom: 20px; right: 20px; } .bottom-left { bottom: 20px; left: 20px; } .top-right { top: 20px; right: 20px; } .top-left { top: 20px; left: 20px; }
        .chat-bottom-right { bottom: 90px; right: 20px; } .chat-bottom-left { bottom: 90px; left: 20px; } .chat-top-right { top: 90px, right: 20px; } .chat-top-left { top: 90px, left: 20px; }
    </style>
</head>
<body>
    <div id="chat-bubble" class="chat-bubble ${bot.widget.bubble.position}">${bot.widget.bubble.icon}</div>
    
    <div id="chat-window" class="chat-window chat-${bot.widget.bubble.position}">
        <div class="chat-header">
            <div class="chat-header-content">
                ${bot.widget.header.bannerImage && bot.widget.header.showBanner ? `<img src="${bot.widget.header.bannerImage}" alt="Banner">` : ''}
                <div class="chat-header-text">
                    <div class="chat-header-title">${bot.widget.header.title}</div>
                    ${bot.widget.header.subtitle ? `<div class="chat-header-subtitle">${bot.widget.header.subtitle}</div>` : ''}
                </div>
            </div>
            <button id="close-chat" class="close-button">×</button>
        </div>
        <div id="chat-messages" class="chat-messages"></div>
        <div id="typing-indicator" class="typing-indicator"><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>AI is typing...</div>
        <div class="chat-input-container">
            <input type="text" id="chat-input" class="chat-input" placeholder="Type your message...">
            <button id="send-button" class="send-button">Send</button>
        </div>
    </div>

    <script>
        // Check for embed mode
        const urlParams = new URLSearchParams(window.location.search);
        const isEmbedded = urlParams.get('embed') === 'true';
        if (isEmbedded) {
            document.body.classList.add('embedded');
        }

        // Bot Configuration (API keys removed for security - use Netlify env vars)
        window.BOT_CONFIG = ${JSON.stringify(bot, (key, value) => {
      if (key === 'geminiApiKey' || key === 'openRouterApiKey' || key === 'memoryKeepApiKey') {
        return undefined; // Omit these keys
      }
      return value;
    })};
        
        // --- Lead Service (Netlify Blobs / localStorage fallback) ---
        class LeadService {
            static getApiUrl() {
                const baseUrl = window.BOT_CONFIG?.settings?.apiBaseUrl || window.location.origin;
                return baseUrl + '/api/leads';
            }
            
            static isNetlifyDeployment() {
                return window.location.hostname.includes('netlify.app') || 
                       window.location.hostname.includes('netlify.live') ||
                       window.location.port === '8888';
            }
            
            static async saveLead(botId, data, source = 'chat_widget') {
                if (this.isNetlifyDeployment()) {
                    try {
                        const response = await fetch(\`\${this.getApiUrl()}?botId=\${botId}\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ botId, data, source })
                        });
                        if (response.ok) {
                            const result = await response.json();
                            console.log('✅ Lead saved to Netlify Blobs:', result);
                            return result;
                        }
                    } catch (error) {
                        console.warn('Netlify save failed, using localStorage:', error);
                    }
                }
                // Fallback to localStorage
                const leads = this.getLocalLeads(botId);
                const newLead = {
                    id: \`lead-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
                    botId, data, timestamp: new Date().toISOString(), source
                };
                leads.push(newLead);
                localStorage.setItem(\`leads-\${botId}\`, JSON.stringify(leads));
                console.log('✅ Lead saved to localStorage:', newLead);
                return { success: true, leadId: newLead.id, totalLeads: leads.length };
            }
            
            static async getLeads(botId) {
                if (this.isNetlifyDeployment()) {
                    try {
                        const response = await fetch(\`\${this.getApiUrl()}?botId=\${botId}\`);
                        if (response.ok) {
                            const result = await response.json();
                            console.log('📋 Leads retrieved from Netlify:', result);
                            return result;
                        }
                    } catch (error) {
                        console.warn('Netlify fetch failed, using localStorage:', error);
                    }
                }
                const leads = this.getLocalLeads(botId);
                return { success: true, leads, count: leads.length };
            }
            
            static getLocalLeads(botId) {
                try {
                    const stored = localStorage.getItem(\`leads-\${botId}\`);
                    return stored ? JSON.parse(stored) : [];
                } catch { return []; }
            }
            
            static formatLeadsForChat(leads) {
                if (leads.length === 0) return '📭 **No leads collected yet.**\\n\\nLeads will appear here when visitors submit the lead capture form.';
                let output = \`📊 **Collected Leads (\${leads.length} total)**\\n\\n\`;
                leads.slice(-10).reverse().forEach((lead, index) => {
                    const date = new Date(lead.timestamp).toLocaleString();
                    output += \`**Lead #\${leads.length - index}** - \${date}\\n\`;
                    Object.entries(lead.data).forEach(([key, value]) => { output += \`• \${key}: \${value}\\n\`; });
                    output += '\\n';
                });
                if (leads.length > 10) output += \`\\n_Showing last 10 of \${leads.length} leads._\`;
                return output;
            }
            
            static downloadCSV(botId, leads) {
                if (leads.length === 0) return;
                const allFields = new Set();
                leads.forEach(lead => Object.keys(lead.data).forEach(key => allFields.add(key)));
                const fieldNames = ['timestamp', ...Array.from(allFields)];
                let csv = fieldNames.join(',') + '\\n';
                leads.forEach(lead => {
                    const row = fieldNames.map(field => {
                        if (field === 'timestamp') return lead.timestamp;
                        const value = lead.data[field] || '';
                        return \`"\${value.replace(/"/g, '""')}"\`;
                    });
                    csv += row.join(',') + '\\n';
                });
                const blob = new Blob([csv], { type: 'text/csv' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = \`leads-\${botId}-\${new Date().toISOString().split('T')[0]}.csv\`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }
        }
        
        // --- MemoryKeep Cloud Client ---
        class MemoryKeepCloud {
            static API_BASE = 'https://memorykeep.cloud/api';
            
            static getBotApiKey(botId) {
                const botConfig = window.BOT_CONFIG;
                if (botConfig && botConfig.id === botId && botConfig.settings.memoryKeepApiKey) {
                    return botConfig.settings.memoryKeepApiKey;
                }
                return 'mira-1234'; // Fallback
            }
            
            static async logMemory(botId, type, entry) {
                try {
                    const key = this.getBotApiKey(botId);
                    const response = await fetch(\`\${this.API_BASE}/log-memory\`, {
                        method: 'POST',
                        headers: { 'Authorization': \`Bearer \${key}\`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type, entry })
                    });
                    if (!response.ok) console.error('MemoryKeep log failed:', response.status, await response.text());
                    else console.log(\`✅ Logged to MemoryKeep [\${type}]\`);
                } catch (error) { console.error('MemoryKeep log error:', error); }
            }

            static async getMemory(botId, type) {
                try {
                    const key = this.getBotApiKey(botId);
                    const response = await fetch(\`\${this.API_BASE}/get-memory?type=\${type}\`, {
                        method: 'GET',
                        headers: { 'Authorization': \`Bearer \${key}\` }
                    });
                    if (!response.ok) {
                        if (response.status !== 404) console.error('MemoryKeep get failed:', response.status, await response.text());
                        return null;
                    }
                    const data = await response.json();
                    console.log(\`📖 Retrieved from MemoryKeep [\${type}]\`);
                    return data.memory;
                } catch (error) { console.error('MemoryKeep get error:', error); return null; }
            }

            static async getAllMemories(botId) {
                const memories = {};
                const types = ['core', 'experience', 'notebook'];
                for (const type of types) {
                    memories[type] = await this.getMemory(botId, type);
                }
                return memories;
            }
        }

        // --- Standalone Chat Bot Logic ---
        class StandaloneChatBot {
            constructor(config) {
                this.config = config;
                this.isOpen = false;
                this.messages = [];
                this.conversationMemory = [];
                this.isTyping = false;
                this.activeLeadModule = null;
                
                // If embedded, start open
                this.isOpen = isEmbedded;
                
                this.init();
            }
            
            init() {
                this.bindEvents();
                // Show greeting if open (embedded) or configured to show on open
                if (this.isOpen && this.config.widget.greeting.showOnOpen) {
                    this.addBotMessage(this.config.widget.greeting.message);
                }
            }
            
            bindEvents() {
                document.getElementById('chat-bubble').addEventListener('click', () => this.toggleChat());
                
                // Only bind close button if NOT embedded
                if (!isEmbedded) {
                    document.getElementById('close-chat').addEventListener('click', () => this.closeChat());
                }
                
                document.getElementById('send-button').addEventListener('click', () => this.sendMessage());
                document.getElementById('chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
            }
            
            toggleChat() {
                this.isOpen = !this.isOpen;
                this.updateDisplay();
                if (this.isOpen && this.messages.length === 0 && this.config.widget.greeting.showOnOpen) {
                    this.addBotMessage(this.config.widget.greeting.message);
                }
            }
            
            closeChat() {
                this.isOpen = false;
                this.updateDisplay();
            }
            
            updateDisplay() {
                const chatWindow = document.getElementById('chat-window');
                if (isEmbedded) {
                     chatWindow.style.display = 'flex'; // Always visible in embed mode
                } else {
                     chatWindow.style.display = this.isOpen ? 'flex' : 'none';
                }
            }
            
            async sendMessage() {
                if (this.isTyping) return;
                const input = document.getElementById('chat-input');
                const message = input.value.trim();
                if (!message) return;
                
                this.addUserMessage(message);
                input.value = '';
                this.showTypingIndicator();
                
                try {
                    const response = await this.processMessage(message);
                    this.hideTypingIndicator();
                    this.addBotMessage(response);
                } catch (error) {
                    console.error('Error processing message:', error);
                    this.hideTypingIndicator();
                    this.addBotMessage("I'm sorry, I'm having trouble responding right now.");
                }
            }
            
            async processMessage(message) {
                // Check for admin commands
                const lowerMsg = message.toLowerCase().trim();
                
                if (lowerMsg === '/help') {
                    return '🤖 **Admin Commands**\\n\\n' +
                        '**/leads** - View all collected leads\\n' +
                        '**/exportleads** - Download leads as CSV file\\n' +
                        '**/help** - Show this help message\\n\\n' +
                        '_These commands are for bot owners to manage lead data._';
                }
                
                if (lowerMsg === '/leads') {
                    try {
                        const result = await LeadService.getLeads(this.config.id);
                        if (result.success && result.leads) {
                            return LeadService.formatLeadsForChat(result.leads);
                        }
                        return '❌ Could not retrieve leads.';
                    } catch (error) {
                        return '❌ Error retrieving leads: ' + error.message;
                    }
                }
                
                if (lowerMsg === '/exportleads') {
                    try {
                        const result = await LeadService.getLeads(this.config.id);
                        if (result.success && result.leads && result.leads.length > 0) {
                            LeadService.downloadCSV(this.config.id, result.leads);
                            return \`📥 **Downloading \${result.leads.length} leads as CSV...**\\n\\nThe file should start downloading automatically.\`;
                        }
                        return '📭 No leads to export yet.';
                    } catch (error) {
                        return '❌ Error exporting leads: ' + error.message;
                    }
                }
                
                const faqModule = this.config.modules.find(m => m.type === 'faq' && m.enabled);
                if (faqModule?.config?.questions) {
                    const lowerMessage = message.toLowerCase();
                    const match = faqModule.config.questions.find(q => lowerMessage.includes(q.question.toLowerCase()));
                    if (match) return match.answer;
                }
                
                // Check for lead capture trigger keywords
                const leadModule = this.config.modules.find(m => m.type === 'lead-capture' && m.enabled);
                if (leadModule) {
                    const lowerMessage = message.toLowerCase();
                    const triggerKeywords = leadModule.config.triggerKeywords || ['contact', 'interested', 'demo', 'quote', 'pricing'];
                    const triggered = triggerKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
                    
                    if (triggered) {
                        this.showLeadForm(leadModule);
                        return leadModule.config.triggerMessage || 'Please fill out the form below to get in touch with us!';
                    }
                }
                
                // Call AI via Netlify proxy (keys stored server-side)
                return await this.callChatProxy(message);
            }
            
            async callChatProxy(message) {
                const provider = this.config.settings.aiProvider || 'gemini';
                const apiBaseUrl = this.config.settings.apiBaseUrl || window.location.origin;
                
                try {
                    const response = await fetch(apiBaseUrl + '/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message,
                            provider,
                            model: this.config.settings.model,
                            systemPrompt: this.config.settings.systemPrompt,
                            conversationMemory: this.conversationMemory,
                            temperature: this.config.settings.temperature,
                            maxTokens: this.config.settings.maxTokens,
                            botId: this.config.id
                        })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Chat proxy error');
                    }
                    
                    const data = await response.json();
                    
                    if (data.success && data.response) {
                        // Update conversation memory
                        this.conversationMemory.push(
                            { role: 'user', content: message },
                            { role: 'assistant', content: data.response }
                        );
                        if (this.conversationMemory.length > 20) {
                            this.conversationMemory = this.conversationMemory.slice(-20);
                        }
                        return data.response;
                    } else {
                        throw new Error(data.error || 'No response from AI');
                    }
                } catch (error) {
                    console.error('Chat proxy error:', error);
                    return "I'm having trouble connecting. Please make sure the bot is deployed to Netlify with API keys configured as environment variables.";
                }
            }
            
            showLeadForm(leadModule) {
                this.activeLeadModule = leadModule;
            }
            
            getLeadFormHtml() {
                if (!this.activeLeadModule) return '';
                const leadModule = this.activeLeadModule;
                const fields = leadModule.config.fields || [];
                const botId = this.config.id;
                
                return \`
                    <div class="lead-form" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 8px 0;">
                        <form id="lead-form" style="display: flex; flex-direction: column; gap: 12px;">
                            \${fields.map(field => \`
                                <div>
                                    <label style="display: block; font-size: 12px; color: #374151; margin-bottom: 4px;">
                                        \${field.label}\${field.required ? ' *' : ''}
                                    </label>
                                    <input 
                                        type="\${field.type}" 
                                        name="\${field.name}" 
                                        \${field.required ? 'required' : ''}
                                        style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                                        placeholder="Enter your \${field.label.toLowerCase()}"
                                    />
                                </div>
                            \`).join('')}
                            <button type="submit" style="background: var(--primary-color); color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                                Submit
                            </button>
                        </form>
                        <button id="close-lead-form" type="button" style="background: none; border: none; color: #6b7280; font-size: 12px; cursor: pointer; margin-top: 8px;">
                            Close form
                        </button>
                    </div>
                \`;
            }
            
            bindLeadFormEvents() {
                const form = document.getElementById('lead-form');
                const closeBtn = document.getElementById('close-lead-form');
                if (!form || !this.activeLeadModule) return;
                
                const leadModule = this.activeLeadModule;
                const fields = leadModule.config.fields || [];
                const self = this;
                
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        self.activeLeadModule = null;
                        self.renderMessages();
                    };
                }
                
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = {};
                    fields.forEach(field => {
                        formData[field.name] = document.querySelector(\`input[name="\${field.name}"]\`).value;
                    });
                    
                    try {
                        await LeadService.saveLead(self.config.id, formData, 'chat_widget');
                        self.activeLeadModule = null;
                        self.addBotMessage(leadModule.config.successMessage || '✅ Thank you! We will get back to you soon.');
                    } catch (error) {
                        console.error('Failed to save lead:', error);
                        alert('Failed to submit. Please try again.');
                    }
                };
            }
            
            addUserMessage(message) { this.messages.push({ text: message, sender: 'user' }); this.renderMessages(); }
            addBotMessage(message) { this.messages.push({ text: message, sender: 'bot' }); this.renderMessages(); }
            
            renderMessages() {
                const container = document.getElementById('chat-messages');
                let html = this.messages.map(msg => \`<div class="message \${msg.sender}-message"><div class="message-content">\${this.formatMessage(msg.text)}</div></div>\`).join('');
                
                // Add lead form if active
                if (this.activeLeadModule) {
                    html += this.getLeadFormHtml();
                }
                
                container.innerHTML = html;
                container.scrollTop = container.scrollHeight;
                
                // Bind events after rendering
                if (this.activeLeadModule) {
                    this.bindLeadFormEvents();
                }
            }
            
            formatMessage(text) { return text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>').replace(/\\*(.*?)\\*/g, '<em>$1</em>').replace(/\\n/g, '<br>'); }
            showTypingIndicator() { this.isTyping = true; document.getElementById('typing-indicator').style.display = 'block'; document.getElementById('send-button').disabled = true; document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight; }
            hideTypingIndicator() { this.isTyping = false; document.getElementById('typing-indicator').style.display = 'none'; document.getElementById('send-button').disabled = false; }
        }
        
        new StandaloneChatBot(window.BOT_CONFIG);
    </script>
</body>
</html>`;
  };

  const handleImportBot = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        const importedBot = { ...importData.bot, id: Date.now().toString() };

        await MemorySystem.saveBot(importedBot);
        if (importData.memories) {
          for (const [type, memory] of Object.entries(importData.memories)) {
            await MemorySystem.saveMemory(importedBot.id, type, memory);
          }
        }

        setActiveBot(importedBot);
        loadBots();
      } catch (error) {
        console.error('Failed to import bot:', error);
        alert('Failed to import bot. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">MemoryKeep Bot Factory</h1>
                </div>
                {activeBot && (
                  <div className="text-sm text-gray-600">
                    Editing: <span className="font-semibold">{activeBot.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowMemoryViewer(!showMemoryViewer)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Memory Viewer
                </button>

                <button
                  onClick={handleExportBot}
                  disabled={!activeBot}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={handleExportStandalone}
                  disabled={!activeBot}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Export HTML</span>
                </button>

                <label className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBot}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Play className="w-4 h-4" />
                  <span>{previewMode ? 'Edit' : 'Preview'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {!previewMode ? (
            <BotFactory
              activeBot={activeBot}
              bots={bots}
              onBotUpdate={handleBotUpdate}
              onBotSelect={setActiveBot}
              showMemoryViewer={showMemoryViewer}
            />
          ) : (
            <div className="flex-1 relative bg-gray-100 overflow-hidden">
              {activeBot ? (
                <div className="w-full h-full relative">
                  {/* Preview Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Play className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Chat Widget Preview</h3>
                      <p className="text-gray-600 mb-4">Click the chat bubble to test your bot</p>
                      {(() => {
                        const provider = activeBot.settings.aiProvider || 'openrouter';
                        const hasGeminiKey = !!activeBot.settings.geminiApiKey;
                        const hasOpenRouterKey = !!activeBot.settings.openRouterApiKey;

                        if (provider === 'gemini' && hasGeminiKey) {
                          return (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                              ✅ Gemini API Connected
                            </div>
                          );
                        } else if (provider === 'openrouter' && hasOpenRouterKey) {
                          return (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                              ✅ OpenRouter API Connected
                            </div>
                          );
                        } else {
                          return (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                              ⚠️ Configure {provider === 'gemini' ? 'Gemini' : 'OpenRouter'} API in AI Settings
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* Chat Widget */}
                  <ChatWidget bot={activeBot} preview={true} />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">Select a bot to preview</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;