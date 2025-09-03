import React, { useState } from 'react';
import { Icons } from './Icons';

interface TopicSelectorProps {
  topics: string[];
  languages: { code: string; name: string }[];
  onStart: (topic: string, language: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ topics, languages, onStart }) => {
  const [customTopic, setCustomTopic] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0].code);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim()) {
      onStart(customTopic.trim(), selectedLanguage);
    }
  };
  
  const handleTopicClick = (topic: string) => {
      onStart(topic, selectedLanguage);
  }

  return (
    <div className="w-full max-w-3xl text-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all animate-fade-in-up">
      <h2 className="text-3xl font-bold text-sky-600 dark:text-sky-400 font-serif mb-2">Bonjour!</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-lg">First, please select your language for explanations.</p>
      
      <div className="max-w-xs mx-auto mb-8">
          <label htmlFor="language-select" className="sr-only">Your Language</label>
          <select 
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
      </div>

      <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">Now, what would you like to learn French with today?</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => handleTopicClick(topic)}
            className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-200 font-semibold text-center hover:bg-sky-100 dark:hover:bg-sky-900/50 hover:text-sky-600 dark:hover:text-sky-400 transition-all transform hover:-translate-y-1"
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-300 dark:border-slate-600" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-slate-800 px-2 text-sm text-slate-500 dark:text-slate-400">Or enter your own topic</span>
        </div>
      </div>

      <form onSubmit={handleCustomSubmit} className="flex gap-2 mt-4">
        <input
          type="text"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="e.g., 'Space Exploration' or 'Vintage Cars'"
          className="flex-grow px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
        />
        <button
          type="submit"
          disabled={!customTopic.trim()}
          className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          Start <Icons.arrowRight className="w-4 h-4 ml-2" />
        </button>
      </form>
    </div>
  );
};

export default TopicSelector;
