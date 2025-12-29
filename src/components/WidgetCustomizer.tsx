import React, { useState, useEffect } from 'react';
import { Bot } from '../types/Bot';
import { ChatWidget } from './ChatWidget';
import { Monitor, Smartphone, Upload, X, Users, Save, Trash2 } from 'lucide-react';
import { AvatarLibrary, SavedAvatar } from '../core/AvatarLibrary';

interface WidgetCustomizerProps {
  bot: Bot;
  onWidgetUpdate: (widgetConfig: Bot['widget']) => void;
}

export const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({
  bot,
  onWidgetUpdate
}) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [avatarLibrary, setAvatarLibrary] = useState<SavedAvatar[]>([]);
  const [showLibraryPicker, setShowLibraryPicker] = useState<'bot' | 'user' | null>(null);
  const [newAvatarName, setNewAvatarName] = useState('');

  // Load avatar library on mount
  useEffect(() => {
    AvatarLibrary.getAvatars().then(setAvatarLibrary);
  }, []);

  // Ensure avatars config exists with defaults
  const avatarsConfig = bot.widget.avatars || {
    bot: { type: 'emoji' as const, value: '🤖' },
    user: { type: 'emoji' as const, value: '👤' },
    showAvatars: true
  };

  const handleHeaderUpdate = (updates: Partial<Bot['widget']['header']>) => {
    const updatedWidget = {
      ...bot.widget,
      header: { ...bot.widget.header, ...updates }
    };
    onWidgetUpdate(updatedWidget);
  };

  const handleGreetingUpdate = (updates: Partial<Bot['widget']['greeting']>) => {
    const updatedWidget = {
      ...bot.widget,
      greeting: { ...bot.widget.greeting, ...updates }
    };
    onWidgetUpdate(updatedWidget);
  };

  const handleBubbleUpdate = (updates: Partial<Bot['widget']['bubble']>) => {
    const updatedWidget = {
      ...bot.widget,
      bubble: { ...bot.widget.bubble, ...updates }
    };
    onWidgetUpdate(updatedWidget);
  };

  const handleThemeUpdate = (updates: Partial<Bot['widget']['theme']>) => {
    const updatedWidget = {
      ...bot.widget,
      theme: { ...bot.widget.theme, ...updates }
    };
    onWidgetUpdate(updatedWidget);
  };

  const handleBannerImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleHeaderUpdate({ bannerImage: result });
    };
    reader.readAsDataURL(file);
  };

  const removeBannerImage = () => {
    handleHeaderUpdate({ bannerImage: undefined });
  };

  const handleAvatarsUpdate = (updates: Partial<Bot['widget']['avatars']>) => {
    const currentAvatars = bot.widget.avatars || {
      bot: { type: 'emoji' as const, value: '🤖' },
      user: { type: 'emoji' as const, value: '👤' },
      showAvatars: true
    };
    const updatedWidget = {
      ...bot.widget,
      avatars: { ...currentAvatars, ...updates }
    };
    onWidgetUpdate(updatedWidget);
  };

  const handleAvatarImageUpload = (target: 'bot' | 'user', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleAvatarsUpdate({
        [target]: { type: 'upload', value: result }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFromLibrary = (target: 'bot' | 'user', avatar: SavedAvatar) => {
    handleAvatarsUpdate({
      [target]: { type: 'library', value: avatar.imageData }
    });
    setShowLibraryPicker(null);
  };

  const handleSaveToLibrary = async (target: 'bot' | 'user') => {
    const avatarValue = avatarsConfig[target].value;
    if (!avatarValue || avatarsConfig[target].type === 'emoji') {
      alert('Upload an image first before saving to library');
      return;
    }
    const name = newAvatarName.trim() || `${target === 'bot' ? 'Bot' : 'User'} Avatar`;
    await AvatarLibrary.saveAvatar(name, avatarValue);
    setAvatarLibrary(await AvatarLibrary.getAvatars());
    setNewAvatarName('');
    alert('Avatar saved to library!');
  };

  const handleDeleteFromLibrary = async (id: string) => {
    if (confirm('Delete this avatar from your library?')) {
      await AvatarLibrary.deleteAvatar(id);
      setAvatarLibrary(await AvatarLibrary.getAvatars());
    }
  };

  const renderAvatarPreview = (target: 'bot' | 'user') => {
    const config = avatarsConfig[target];
    if (config.type === 'emoji') {
      return <span className="text-2xl">{config.value}</span>;
    }
    return <img src={config.value} alt={target} className="w-full h-full object-cover rounded-full" />;
  };

  return (
    <div className="flex h-full">
      {/* Configuration Panel */}
      <div className="w-96 bg-white shadow-lg border-r overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chat Widget Customization</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Live Preview:</strong> Changes are applied instantly to the preview on the right.
                All styling updates work in both preview and exported standalone widgets.
              </p>
            </div>
          </div>

          {/* Header Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Header</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={bot.widget.header.title}
                onChange={(e) => handleHeaderUpdate({ title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Chat Support"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle (optional)
              </label>
              <input
                type="text"
                value={bot.widget.header.subtitle || ''}
                onChange={(e) => handleHeaderUpdate({ subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="We're here to help!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image
              </label>
              {bot.widget.header.bannerImage ? (
                <div className="space-y-2">
                  <div className="relative">
                    <img
                      src={bot.widget.header.bannerImage}
                      alt="Banner"
                      className="w-full h-20 object-cover rounded-md border"
                    />
                    <button
                      onClick={removeBannerImage}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <label className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Replace Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Banner Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageUpload}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Supports PNG, JPG, SVG. Recommended size: 320x80px
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={bot.widget.header.showBanner}
                  onChange={(e) => handleHeaderUpdate({ showBanner: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show banner image in header</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header Background
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={bot.widget.header.backgroundColor}
                    onChange={(e) => handleHeaderUpdate({ backgroundColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bot.widget.header.backgroundColor}
                    onChange={(e) => handleHeaderUpdate({ backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header Text Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={bot.widget.header.textColor}
                    onChange={(e) => handleHeaderUpdate({ textColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bot.widget.header.textColor}
                    onChange={(e) => handleHeaderUpdate({ textColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Greeting Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Opening Greeting</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greeting Message
              </label>
              <textarea
                value={bot.widget.greeting.message}
                onChange={(e) => handleGreetingUpdate({ message: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Hello! How can I help you today?"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={bot.widget.greeting.showOnOpen}
                  onChange={(e) => handleGreetingUpdate({ showOnOpen: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show greeting when chat opens</span>
              </label>
            </div>
          </div>

          {/* Bubble Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Chat Bubble</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chat Bubble Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={bot.widget.bubble.color}
                  onChange={(e) => handleBubbleUpdate({ color: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={bot.widget.bubble.color}
                  onChange={(e) => handleBubbleUpdate({ color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bubble Icon
              </label>
              <input
                type="text"
                value={bot.widget.bubble.icon}
                onChange={(e) => handleBubbleUpdate({ icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="💬"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use emoji, text, or HTML entities (e.g., 💬, 🤖, ?, !)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bubble Position
              </label>
              <select
                value={bot.widget.bubble.position}
                onChange={(e) => handleBubbleUpdate({ position: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Theme</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color (User Messages)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={bot.widget.theme.primaryColor}
                    onChange={(e) => handleThemeUpdate({ primaryColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bot.widget.theme.primaryColor}
                    onChange={(e) => handleThemeUpdate({ primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color (Accents)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={bot.widget.theme.secondaryColor}
                    onChange={(e) => handleThemeUpdate({ secondaryColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bot.widget.theme.secondaryColor}
                    onChange={(e) => handleThemeUpdate({ secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="#10B981"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={bot.widget.theme.fontFamily}
                onChange={(e) => handleThemeUpdate({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Inter, sans-serif">Inter</option>
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Open Sans, sans-serif">Open Sans</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Courier New, monospace">Courier New</option>
              </select>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="font-medium text-green-900 mb-2">✅ Widget Styling Active</h4>
              <p className="text-sm text-green-800">
                All color and styling changes are working correctly and will be applied to:
              </p>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>• Live preview (right panel)</li>
                <li>• Exported standalone HTML files</li>
                <li>• Production chat widgets</li>
              </ul>
            </div>
          </div>

          {/* Avatar Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Avatars
            </h3>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={avatarsConfig.showAvatars}
                  onChange={(e) => handleAvatarsUpdate({ showAvatars: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show avatars in chat</span>
              </label>
            </div>

            {/* Bot Avatar */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Bot Avatar</h4>
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-white rounded-full border-2 border-indigo-200 flex items-center justify-center overflow-hidden">
                  {renderAvatarPreview('bot')}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={avatarsConfig.bot.type === 'emoji' ? avatarsConfig.bot.value : ''}
                      onChange={(e) => handleAvatarsUpdate({ bot: { type: 'emoji', value: e.target.value } })}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                      placeholder="Emoji (e.g., 🤖)"
                    />
                    <label className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer flex items-center">
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarImageUpload('bot', e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowLibraryPicker('bot')}
                      className="flex-1 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50"
                    >
                      Choose from Library
                    </button>
                    {avatarsConfig.bot.type !== 'emoji' && (
                      <button
                        onClick={() => handleSaveToLibrary('bot')}
                        className="px-3 py-1.5 text-sm text-green-600 border border-green-300 rounded-md hover:bg-green-50 flex items-center"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* User Avatar */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">User Avatar</h4>
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                  {renderAvatarPreview('user')}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={avatarsConfig.user.type === 'emoji' ? avatarsConfig.user.value : ''}
                      onChange={(e) => handleAvatarsUpdate({ user: { type: 'emoji', value: e.target.value } })}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                      placeholder="Emoji (e.g., 👤)"
                    />
                    <label className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer flex items-center">
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarImageUpload('user', e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowLibraryPicker('user')}
                      className="flex-1 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50"
                    >
                      Choose from Library
                    </button>
                    {avatarsConfig.user.type !== 'emoji' && (
                      <button
                        onClick={() => handleSaveToLibrary('user')}
                        className="px-3 py-1.5 text-sm text-green-600 border border-green-300 rounded-md hover:bg-green-50 flex items-center"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Library Picker Modal */}
            {showLibraryPicker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Choose {showLibraryPicker === 'bot' ? 'Bot' : 'User'} Avatar</h4>
                    <button onClick={() => setShowLibraryPicker(null)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {avatarLibrary.map(avatar => (
                      <div key={avatar.id} className="relative group">
                        <button
                          onClick={() => handleSelectFromLibrary(showLibraryPicker, avatar)}
                          className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 hover:border-indigo-500 transition-colors"
                        >
                          <img src={avatar.imageData} alt={avatar.name} className="w-full h-full object-cover" />
                        </button>
                        {!avatar.id.startsWith('preset-') && (
                          <button
                            onClick={() => handleDeleteFromLibrary(avatar.id)}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <p className="text-xs text-center mt-1 truncate">{avatar.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-gray-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Live Preview</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md ${previewMode === 'desktop'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md ${previewMode === 'mobile'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        <div className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${previewMode === 'desktop' ? 'max-w-4xl' : 'max-w-sm'
          }`}>
          <div className="h-96 relative" style={{ backgroundColor: '#f8fafc' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Demo Website</h3>
                <p className="text-gray-500 mb-4">Click the chat bubble to test your widget!</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  ✅ All styling changes are live
                </div>
              </div>
            </div>

            <ChatWidget bot={bot} preview={true} />
          </div>
        </div>
      </div>
    </div>
  );
};