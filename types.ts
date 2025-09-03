import { Chat } from "@google/genai";

export enum ChatRole {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export interface PronunciationFeedback {
  score: number;
  feedback: string;
  userTranscript: string;
}

export interface GeminiService {
    startChatSession: (interest: string, motherTongue: string) => Promise<Chat | null>;
    sendMessageStream: (chat: Chat, message: string, onChunk: (text: string) => void, onComplete: () => void) => Promise<void>;
    getPronunciationFeedback: (originalText: string, userTranscript: string, motherTongue: string) => Promise<PronunciationFeedback | null>;
}