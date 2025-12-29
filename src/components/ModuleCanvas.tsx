import React, { useState } from 'react';
import { BotModule } from '../types/Bot';
import { moduleRegistry } from '../modules/moduleRegistry';
import { Settings, Trash2, Eye, EyeOff } from 'lucide-react';

interface ModuleCanvasProps {
  modules: BotModule[];
  onModuleUpdate: (moduleId: string, updates: Partial<BotModule>) => void;
  onModuleDelete: (moduleId: string) => void;
}

export const ModuleCanvas: React.FC<ModuleCanvasProps> = ({
  modules,
  onModuleUpdate,
  onModuleDelete
}) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(moduleId);
    setShowConfig(true);
  };

  const handleConfigUpdate = (moduleId: string, config: Record<string, any>) => {
    onModuleUpdate(moduleId, { config });
  };

  const handleToggleEnabled = (moduleId: string, enabled: boolean) => {
    onModuleUpdate(moduleId, { enabled });
  };

  const selectedModuleData = modules.find(m => m.id === selectedModule);
  const moduleDefinition = selectedModuleData ? moduleRegistry.getModule(selectedModuleData.type) : null;

  return (
    <div className="flex-1 flex">
      {/* Canvas */}
      <div className="flex-1 bg-gray-50 relative overflow-auto">
        <div className="absolute inset-0 p-6">
          {modules.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Modules Added</h3>
                <p className="text-gray-500">
                  Add modules from the library to start building your bot
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => {
                const definition = moduleRegistry.getModule(module.type);
                if (!definition) return null;

                return (
                  <div
                    key={module.id}
                    className={`bg-white rounded-lg shadow-md border-2 transition-all cursor-pointer ${
                      selectedModule === module.id
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!module.enabled ? 'opacity-50' : ''}`}
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{definition.icon}</div>
                          <div>
                            <h3 className="font-medium text-gray-900">{definition.name}</h3>
                            <p className="text-sm text-gray-500">{definition.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEnabled(module.id, !module.enabled);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            {module.enabled ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onModuleDelete(module.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Status:</span>
                          <span className={`font-medium ${module.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                            {module.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && selectedModuleData && moduleDefinition && (
        <div className="w-96 bg-white shadow-lg border-l">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Configure {moduleDefinition.name}
              </h3>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <moduleDefinition.configComponent
              config={selectedModuleData.config}
              onConfigUpdate={(config) => handleConfigUpdate(selectedModuleData.id, config)}
            />
          </div>
        </div>
      )}
    </div>
  );
};