import React from 'react';
import { BotModule } from '../../types/Bot';
import { MemorySystem } from '../../core/MemorySystem';
import { Globe } from 'lucide-react';

interface HelloWorldModuleProps {
  module: BotModule;
  botId: string;
}

export const HelloWorldModule: React.FC<HelloWorldModuleProps> = ({ module, botId }) => {
  const message = module.config.message || 'Hello, World!';
  const showTimestamp = module.config.showTimestamp !== false;

  const handleInteraction = async () => {
    // Log this interaction to bot memory
    await MemorySystem.logExperience(botId, {
      type: 'hello_world_interaction',
      message: message,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <div className="mb-6">
        <Globe className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hello World Module</h2>
        <p className="text-gray-600">This is an example module for developers</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-2">{message}</h3>
        {showTimestamp && (
          <p className="text-indigo-100 text-sm">
            {new Date().toLocaleString()}
          </p>
        )}
      </div>

      <button
        onClick={handleInteraction}
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Log Interaction
      </button>

      <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Developer Notes:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• This module demonstrates the basic structure</li>
          <li>• It uses the memory system to log interactions</li>
          <li>• Configuration is handled through the config panel</li>
          <li>• You can extend this pattern for complex modules</li>
        </ul>
      </div>
    </div>
  );
};

interface HelloWorldConfigComponentProps {
  config: any;
  onConfigUpdate: (config: any) => void;
}

export const HelloWorldConfigComponent: React.FC<HelloWorldConfigComponentProps> = ({
  config,
  onConfigUpdate
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hello World Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          This is an example configuration panel. Use this pattern to create settings for your custom modules.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <input
            type="text"
            value={config.message || ''}
            onChange={(e) => onConfigUpdate({ ...config, message: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter your message"
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.showTimestamp !== false}
              onChange={(e) => onConfigUpdate({ ...config, showTimestamp: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Show timestamp</span>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Development Guide</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Creating a new module:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create a new folder in src/modules/</li>
            <li>Create YourModule.tsx with component and config</li>
            <li>Register it in moduleRegistry.ts</li>
            <li>Your module will appear in the library</li>
          </ol>
          <p className="mt-3"><strong>Key patterns:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use MemorySystem for data persistence</li>
            <li>Accept module and botId as props</li>
            <li>Create separate config component</li>
            <li>Log interactions for analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};