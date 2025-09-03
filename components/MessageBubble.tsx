import React, { useState, useEffect } from 'react';
import { ChatMessage, ChatRole } from '../types';
import { Icons } from './Icons';
import PronunciationModal from './PronunciationModal';

interface MessageBubbleProps {
  message: ChatMessage;
  motherTongue: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, motherTongue }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textToPractice, setTextToPractice] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  const isUser = message.role === ChatRole.USER;
  const bubbleClasses = isUser
    ? 'bg-sky-600 text-white rounded-br-none'
    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none';
  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const frenchVoice = voices.find(voice => voice.lang === 'fr-FR' && voice.name.toLowerCase().includes('google')) || 
                         voices.find(voice => voice.lang === 'fr-FR') ||
                         voices.find(voice => voice.lang.startsWith('fr-'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Sorry, your browser doesn't support text-to-speech.");
    }
  };

  const handlePractice = (text: string) => {
    setTextToPractice(text);
    setIsModalOpen(true);
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\[fr\].*?\[\/fr\])/g);

    return parts.map((part, index) => {
      if (part.startsWith('[fr]') && part.endsWith('[/fr]')) {
        const frenchText = part.slice(4, -5);
        return (
          <span key={index} className="inline-flex items-center gap-1 bg-white/60 dark:bg-slate-900/40 px-2 py-1 rounded-md mx-1 my-0.5 align-middle">
            <em className="font-semibold not-italic text-sky-700 dark:text-sky-300">{frenchText}</em>
            <button
              onClick={() => handleSpeak(frenchText)}
              className="p-1 rounded-full text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label={`Listen to "${frenchText}"`}
            >
              <Icons.speaker className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePractice(frenchText)}
              className="p-1 rounded-full text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label={`Practice saying "${frenchText}"`}
            >
              <Icons.microphone className="w-4 h-4" />
            </button>
          </span>
        );
      }
      
      return part.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+)/g).map((subPart, subIndex) => {
        if (subPart.startsWith('**') && subPart.endsWith('**')) {
          return <strong key={`${index}-${subIndex}`}>{subPart.slice(2, -2)}</strong>;
        }
        if (subPart.match(/https?:\/\/[^\s]+/)) {
          return <a href={subPart} key={`${index}-${subIndex}`} target="_blank" rel="noopener noreferrer" className="text-sky-500 underline hover:text-sky-400">{subPart}</a>;
        }
        return subPart.split('\n').map((line, i) => <span key={`${index}-${subIndex}-${i}`}>{line}{i < subPart.split('\n').length - 1 && <br/>}</span>);
      });
    });
  };

  return (
    <>
      <div className={`flex items-start gap-3 ${containerClasses} animate-fade-in`}>
        {!isUser && (
          <div className="w-8 h-8 flex-shrink-0 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-sm font-serif mt-1">
            A
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl max-w-lg md:max-w-xl prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 leading-relaxed ${bubbleClasses}`}
        >
          {renderText(message.text)}
        </div>
        {isUser && (
          <div className="w-8 h-8 flex-shrink-0 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold mt-1">
              <Icons.user className="w-5 h-5"/>
          </div>
        )}
      </div>
      {isModalOpen && (
        <PronunciationModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          textToPractice={textToPractice}
          motherTongue={motherTongue}
        />
      )}
    </>
  );
};

export default MessageBubble;
