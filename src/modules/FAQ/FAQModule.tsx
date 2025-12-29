import React, { useState } from 'react';
import { BotModule } from '../../types/Bot';
import { MemorySystem } from '../../core/MemorySystem';
import { Search, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQModuleProps {
  module: BotModule;
  botId: string;
}

interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export const FAQModule: React.FC<FAQModuleProps> = ({ module, botId }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const questions: FAQQuestion[] = module.config.questions || [];
  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuestionClick = async (question: FAQQuestion) => {
    setExpandedId(expandedId === question.id ? null : question.id);
    
    // Log this interaction to bot memory
    await MemorySystem.logExperience(botId, {
      type: 'faq_interaction',
      question: question.question,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
        <p className="text-gray-600">Find answers to common questions below.</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filteredQuestions.map((faq) => (
          <div
            key={faq.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => handleQuestionClick(faq)}
              className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                {expandedId === faq.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </button>
            
            {expandedId === faq.id && (
              <div className="px-6 pb-4">
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            {searchQuery ? 'No questions match your search.' : 'No FAQ questions configured yet.'}
          </div>
        </div>
      )}
    </div>
  );
};

interface FAQConfigComponentProps {
  config: any;
  onConfigUpdate: (config: any) => void;
}

export const FAQConfigComponent: React.FC<FAQConfigComponentProps> = ({
  config,
  onConfigUpdate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({ question: '', answer: '' });

  const questions: FAQQuestion[] = config.questions || [];

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim() || !newQuestion.answer.trim()) return;

    const updatedQuestions = [
      ...questions,
      {
        id: Date.now().toString(),
        question: newQuestion.question.trim(),
        answer: newQuestion.answer.trim()
      }
    ];

    onConfigUpdate({
      ...config,
      questions: updatedQuestions
    });

    setNewQuestion({ question: '', answer: '' });
  };

  const handleUpdateQuestion = (id: string, updates: Partial<FAQQuestion>) => {
    const updatedQuestions = questions.map(q =>
      q.id === id ? { ...q, ...updates } : q
    );

    onConfigUpdate({
      ...config,
      questions: updatedQuestions
    });

    setEditingId(null);
  };

  const handleDeleteQuestion = (id: string) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    onConfigUpdate({
      ...config,
      questions: updatedQuestions
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">FAQ Configuration</h3>
      </div>

      {/* Existing Questions */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {questions.map((question) => (
          <div key={question.id} className="bg-gray-50 rounded-lg p-4">
            {editingId === question.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => handleUpdateQuestion(question.id, { question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Question"
                />
                <textarea
                  value={question.answer}
                  onChange={(e) => handleUpdateQuestion(question.id, { answer: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Answer"
                />
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
                    <h4 className="font-medium text-gray-900">{question.question}</h4>
                    <p className="text-sm text-gray-600 mt-1">{question.answer}</p>
                  </div>
                  <div className="flex space-x-1 ml-4">
                    <button
                      onClick={() => setEditingId(question.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
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

      {/* Add New Question */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Add New Question</h4>
        <div className="space-y-3">
          <input
            type="text"
            value={newQuestion.question}
            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter question..."
          />
          <textarea
            value={newQuestion.answer}
            onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter answer..."
          />
          <button
            onClick={handleAddQuestion}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>
    </div>
  );
};