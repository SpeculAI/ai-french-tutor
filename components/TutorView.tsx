import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatWindow from './ChatWindow';
import { ChatMessage, ChatRole } from '../types';
import { geminiService } from '../services/geminiService';
import type { Chat } from '@google/genai';

interface TutorViewProps {
  interest: string;
  motherTongue: string;
}

const TutorView: React.FC<TutorViewProps> = ({ interest, motherTongue }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isStreaming = useRef(false);

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      setError(null);
      setMessages([]);
      try {
        const chatSession = await geminiService.startChatSession(interest, motherTongue);
        if (chatSession) {
          setChat(chatSession);
          // Initial message to kickstart the conversation from AI
          const initialMessage: ChatMessage = { role: ChatRole.AI, text: '' };
          setMessages([initialMessage]);
          
          isStreaming.current = true;
          await geminiService.sendMessageStream(
            chatSession,
            `My interest is: ${interest}. Please start my first lesson.`,
            (chunk) => {
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text += chunk;
                return newMessages;
              });
            },
            () => {
              isStreaming.current = false;
              setIsLoading(false);
            }
          );
        } else {
          setError("Failed to initialize tutoring session. Is your API key configured correctly?");
          setIsLoading(false);
        }
      } catch (e) {
        setError("An unexpected error occurred during initialization.");
        setIsLoading(false);
      }
    };

    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interest, motherTongue]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!chat || isLoading || isStreaming.current) return;
    
    const userMessage: ChatMessage = { role: ChatRole.USER, text: messageText };
    const aiResponsePlaceholder: ChatMessage = { role: ChatRole.AI, text: '' };
    setMessages(prev => [...prev, userMessage, aiResponsePlaceholder]);
    
    setIsLoading(true);
    isStreaming.current = true;

    await geminiService.sendMessageStream(
      chat,
      messageText,
      (chunk) => {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text += chunk;
          return newMessages;
        });
      },
      () => {
        isStreaming.current = false;
        setIsLoading(false);
      }
    );
  }, [chat, isLoading]);

  return (
    <div className="w-full h-full max-w-4xl flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-center">Your Topic: <span className="text-sky-600 dark:text-sky-400 font-bold">{interest}</span></h3>
      </div>
      {error && <div className="p-4 text-center text-red-500 bg-red-100 dark:bg-red-900/50">{error}</div>}
      <ChatWindow 
        messages={messages} 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        motherTongue={motherTongue}
      />
    </div>
  );
};

export default TutorView;