import React, { useState } from 'react';
import { BotModule } from '../../types/Bot';
import { MemorySystem } from '../../core/MemorySystem';
import { Search, BookOpen, Tag, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react';

interface KnowledgeBaseModuleProps {
  module: BotModule;
  botId: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
}

export const KnowledgeBaseModule: React.FC<KnowledgeBaseModuleProps> = ({ module, botId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const articles: Article[] = module.config.articles || [];
  const categories: string[] = module.config.categories || [];
  const searchEnabled = module.config.searchEnabled !== false;

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !selectedCategory || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleArticleClick = async (article: Article) => {
    setSelectedArticle(article);

    // Log this interaction to bot memory
    await MemorySystem.logExperience(botId, {
      type: 'knowledge_base_access',
      article: article.title,
      timestamp: new Date().toISOString()
    });
  };

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ChevronRight className="w-4 h-4 transform rotate-180" />
            <span>Back to articles</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedArticle.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {selectedArticle.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {selectedArticle.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Knowledge Base</h2>
        <p className="text-gray-600">Browse our collection of helpful articles and guides.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {searchEnabled && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${!selectedCategory
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            onClick={() => handleArticleClick(article)}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <BookOpen className="w-6 h-6 text-indigo-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                  <p className="text-gray-600 mb-3 line-clamp-3">
                    {article.content.substring(0, 150)}...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{article.tags.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500">
            {searchQuery || selectedCategory
              ? 'No articles match your search criteria.'
              : 'No articles configured yet.'}
          </div>
        </div>
      )}
    </div>
  );
};

interface KnowledgeBaseConfigComponentProps {
  config: any;
  onConfigUpdate: (config: any) => void;
}

export const KnowledgeBaseConfigComponent: React.FC<KnowledgeBaseConfigComponentProps> = ({
  config,
  onConfigUpdate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    tags: '',
    category: ''
  });

  const articles: Article[] = config.articles || [];
  const categories: string[] = config.categories || [];

  const handleAddArticle = () => {
    if (!newArticle.title.trim() || !newArticle.content.trim()) return;

    const article: Article = {
      id: Date.now().toString(),
      title: newArticle.title.trim(),
      content: newArticle.content.trim(),
      tags: newArticle.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: newArticle.category || undefined
    };

    onConfigUpdate({
      ...config,
      articles: [...articles, article]
    });

    setNewArticle({ title: '', content: '', tags: '', category: '' });
  };

  const handleUpdateArticle = (id: string, updates: Partial<Article>) => {
    const updatedArticles = articles.map(article =>
      article.id === id ? { ...article, ...updates } : article
    );

    onConfigUpdate({
      ...config,
      articles: updatedArticles
    });

    setEditingId(null);
  };

  const handleDeleteArticle = (id: string) => {
    const updatedArticles = articles.filter(article => article.id !== id);
    onConfigUpdate({
      ...config,
      articles: updatedArticles
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Base Configuration</h3>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.searchEnabled !== false}
              onChange={(e) => onConfigUpdate({ ...config, searchEnabled: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Enable search</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories (comma-separated)
          </label>
          <input
            type="text"
            value={categories.join(', ')}
            onChange={(e) => onConfigUpdate({
              ...config,
              categories: e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="General, Technical, FAQ"
          />
        </div>
      </div>

      {/* Articles */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Articles</h4>
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="bg-gray-50 rounded-lg p-4">
              {editingId === article.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={article.title}
                    onChange={(e) => handleUpdateArticle(article.id, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Article title"
                  />
                  <textarea
                    value={article.content}
                    onChange={(e) => handleUpdateArticle(article.id, { content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Article content"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={article.tags.join(', ')}
                      onChange={(e) => handleUpdateArticle(article.id, {
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Tags (comma-separated)"
                    />
                    <select
                      value={article.category || ''}
                      onChange={(e) => handleUpdateArticle(article.id, { category: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">No category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{article.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.content}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.map(tag => (
                          <span key={tag} className="inline-block px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-4">
                      <button
                        onClick={() => setEditingId(article.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add New Article */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Add New Article</h4>
        <div className="space-y-3">
          <input
            type="text"
            value={newArticle.title}
            onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Article title"
          />
          <textarea
            value={newArticle.content}
            onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Article content"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={newArticle.tags}
              onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tags (comma-separated)"
            />
            <select
              value={newArticle.category}
              onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddArticle}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Article</span>
          </button>
        </div>
      </div>
    </div>
  );
};