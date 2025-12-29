import React from 'react';
import { moduleRegistry } from '../modules/moduleRegistry';
import { Plus } from 'lucide-react';

interface ModuleLibraryProps {
  onModuleAdd: (moduleType: string) => void;
}

export const ModuleLibrary: React.FC<ModuleLibraryProps> = ({ onModuleAdd }) => {
  const modules = moduleRegistry.getAllModules();

  return (
    <div className="w-80 bg-white shadow-lg border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Module Library</h2>
        <p className="text-sm text-gray-500 mt-1">Drag modules to the canvas or click to add</p>
      </div>
      
      <div className="p-4 space-y-3">
        {modules.map((module) => (
          <div
            key={module.type}
            className="group p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
            onClick={() => onModuleAdd(module.type)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{module.icon}</div>
                <div>
                  <h3 className="font-medium text-gray-900">{module.name}</h3>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
              </div>
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">Need More Modules?</h3>
        <p className="text-sm text-gray-600">
          The system is designed to be extensible. Check the documentation for examples of how to add custom modules.
        </p>
      </div>
    </div>
  );
};