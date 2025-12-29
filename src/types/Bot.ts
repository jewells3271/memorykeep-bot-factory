export interface Bot {
  id: string;
  name: string;
  description: string;
  modules: BotModule[];
  widget: WidgetConfig;
  settings: BotSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BotModule {
  id: string;
  type: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  enabled: boolean;
}

export interface BotSettings {
  // AI Provider selection
  aiProvider?: 'openrouter' | 'gemini';

  // OpenRouter settings
  openRouterApiKey?: string;

  // Gemini settings
  geminiApiKey?: string;

  // Common settings
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  memoryKeepApiKey?: string;

  // API Base URL for deployed backend
  apiBaseUrl?: string;

  isActive?: boolean;
  allowedDomains?: string[];
  rateLimiting?: {
    enabled: boolean;
    maxRequests: number;
    timeWindow: number;
  };
  analytics?: {
    enabled: boolean;
    trackConversations: boolean;
    trackUserActions: boolean;
  };
}

export interface WidgetConfig {
  header: {
    title: string;
    subtitle?: string;
    backgroundColor: string;
    textColor: string;
    bannerImage?: string; // URL or base64 data URL
    showBanner: boolean;
  };
  greeting: {
    message: string;
    showOnOpen: boolean;
  };
  bubble: {
    color: string;
    icon: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  avatars: {
    bot: {
      type: 'emoji' | 'url' | 'upload' | 'library';
      value: string; // emoji, URL, base64, or library ID
    };
    user: {
      type: 'emoji' | 'url' | 'upload' | 'library';
      value: string;
    };
    showAvatars: boolean;
  };
}

export interface ModuleDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  defaultConfig: Record<string, any>;
  component: React.ComponentType<any>;
  configComponent: React.ComponentType<any>;
}