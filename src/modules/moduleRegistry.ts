import { ModuleDefinition } from '../types/Bot';
import { FAQModule, FAQConfigComponent } from './FAQ/FAQModule';
import { LeadCaptureModule, LeadCaptureConfigComponent } from './LeadCapture/LeadCaptureModule';
import { KnowledgeBaseModule, KnowledgeBaseConfigComponent } from './KnowledgeBase/KnowledgeBaseModule';

// Example module for demonstration
import { HelloWorldModule, HelloWorldConfigComponent } from './HelloWorld/HelloWorldModule';

class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();

  constructor() {
    this.registerDefaultModules();
  }

  private registerDefaultModules() {
    // Register core modules
    this.registerModule({
      type: 'faq',
      name: 'FAQ',
      description: 'Frequently Asked Questions with automated responses',
      icon: '❓',
      defaultConfig: {
        questions: [
          {
            question: 'What are your business hours?',
            answer: 'We are open Monday through Friday, 9 AM to 6 PM.'
          }
        ]
      },
      component: FAQModule,
      configComponent: FAQConfigComponent
    });

    this.registerModule({
      type: 'lead-capture',
      name: 'Lead Capture',
      description: 'Collect visitor information and generate leads',
      icon: '📝',
      defaultConfig: {
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: false }
        ],
        successMessage: 'Thank you! We will get back to you soon.',
        triggerMessage: 'Interested in learning more? Leave your details below!',
        triggerKeywords: ['contact', 'interested', 'demo', 'quote', 'pricing', 'sign up', 'get started']
      },
      component: LeadCaptureModule,
      configComponent: LeadCaptureConfigComponent
    });

    this.registerModule({
      type: 'knowledge-base',
      name: 'Knowledge Base',
      description: 'Searchable knowledge base with articles and answers',
      icon: '📚',
      defaultConfig: {
        articles: [
          {
            title: 'Getting Started',
            content: 'Welcome to our service! Here is how to get started...',
            tags: ['tutorial', 'beginner']
          }
        ],
        searchEnabled: true,
        categories: ['General', 'Technical', 'Billing']
      },
      component: KnowledgeBaseModule,
      configComponent: KnowledgeBaseConfigComponent
    });

    // Register example module for extensibility demonstration
    this.registerModule({
      type: 'hello-world',
      name: 'Hello World',
      description: 'Example module for developers to learn from',
      icon: '🌍',
      defaultConfig: {
        message: 'Hello, World!',
        showTimestamp: true
      },
      component: HelloWorldModule,
      configComponent: HelloWorldConfigComponent
    });
  }

  registerModule(module: ModuleDefinition) {
    this.modules.set(module.type, module);
  }

  getModule(type: string): ModuleDefinition | undefined {
    return this.modules.get(type);
  }

  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  unregisterModule(type: string) {
    this.modules.delete(type);
  }
}

export const moduleRegistry = new ModuleRegistry();