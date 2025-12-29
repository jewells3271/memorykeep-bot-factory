import React, { useState } from 'react';
import { BotModule } from '../../types/Bot';
import { LeadService } from '../../core/LeadService';
import { User, Mail, Phone, Send, CheckCircle } from 'lucide-react';

interface LeadCaptureModuleProps {
  module: BotModule;
  botId: string;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export const LeadCaptureModule: React.FC<LeadCaptureModuleProps> = ({ module, botId }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields: FormField[] = module.config.fields || [];
  const successMessage = module.config.successMessage || 'Thank you for your information!';
  const triggerMessage = module.config.triggerMessage || 'Please fill out the form below:';

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save lead to Netlify Blobs (or localStorage fallback)
      const result = await LeadService.saveLead(botId, formData, 'chat_widget');

      if (result.success) {
        console.log('Lead saved successfully:', result);
        setIsSubmitted(true);
      } else {
        console.error('Failed to save lead:', result.error);
      }
    } catch (error) {
      console.error('Failed to save lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'tel':
        return <Phone className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-600">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Get In Touch</h2>
        <p className="text-gray-600">{triggerMessage}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                {getFieldIcon(field.type)}
              </div>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={field.required}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={field.type === 'email' ? 'Enter your email address' : field.type === 'tel' ? 'Enter your phone number' : 'Enter text'}
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

interface LeadCaptureConfigComponentProps {
  config: any;
  onConfigUpdate: (config: any) => void;
}

export const LeadCaptureConfigComponent: React.FC<LeadCaptureConfigComponentProps> = ({
  config,
  onConfigUpdate
}) => {
  const [newField, setNewField] = useState<FormField>({
    name: '',
    label: '',
    type: 'text',
    required: false
  });

  const fields: FormField[] = config.fields || [];

  const handleAddField = () => {
    if (!newField.name.trim() || !newField.label.trim()) {
      alert('Please enter both Field Name and Field Label');
      return;
    }

    const updatedFields = [
      ...fields,
      {
        ...newField,
        name: newField.name.trim().toLowerCase().replace(/\s+/g, '_')
      }
    ];

    onConfigUpdate({
      ...config,
      fields: updatedFields
    });

    setNewField({ name: '', label: '', type: 'text', required: false });
  };

  const handleUpdateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );

    onConfigUpdate({
      ...config,
      fields: updatedFields
    });
  };

  const handleDeleteField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onConfigUpdate({
      ...config,
      fields: updatedFields
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Capture Configuration</h3>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trigger Message
          </label>
          <input
            type="text"
            value={config.triggerMessage || ''}
            onChange={(e) => onConfigUpdate({ ...config, triggerMessage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Message to show above the form"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Success Message
          </label>
          <input
            type="text"
            value={config.successMessage || ''}
            onChange={(e) => onConfigUpdate({ ...config, successMessage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Message to show after successful submission"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trigger Keywords
          </label>
          <input
            type="text"
            defaultValue={(config.triggerKeywords || []).join(', ')}
            onBlur={(e) => onConfigUpdate({
              ...config,
              triggerKeywords: e.target.value.split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="contact, interested, demo, quote"
          />
          <p className="mt-1 text-sm text-gray-500">
            Comma-separated keywords that trigger the lead form (e.g., "contact, demo, pricing")
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Form Fields</h4>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => handleUpdateField(index, { type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="number">Number</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                  <button
                    onClick={() => handleDeleteField(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Field */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Add New Field</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Field name"
            />
          </div>
          <div>
            <input
              type="text"
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Field label"
            />
          </div>
          <div>
            <select
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="tel">Phone</option>
              <option value="number">Number</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Required</span>
            </label>
            <button
              type="button"
              onClick={handleAddField}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Add Field
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};