import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { GeminiService, PronunciationFeedback } from '../types';

const getSystemInstruction = (interest: string, motherTongue: string): string => {
    return `You are Aélis, an expert, friendly, and encouraging French language tutor. Your goal is to teach French based on the CEFR framework, specifically inspired by DELF B1/B2 levels, but uniquely tailored to the user's stated interest. 
    The user's interest is: "${interest}".
    The user's mother tongue is: "${motherTongue}".
    
    Your mission:
    1.  **IMPORTANT:** All explanations, instructions, and guidance MUST be in ${motherTongue}. Use French ONLY for examples, vocabulary, and practice phrases.
    2.  **CRITICAL FOR PRONUNCIATION:** Every time you provide a French word, phrase, or sentence for the user to learn, you MUST wrap it in special tags: \`[fr]Le texte en français ici[/fr]\`. This is essential for the app's text-to-speech feature.
        - Example: To teach the word "cat", you would write: The French word for "cat" is [fr]chat[/fr].
        - Example: For a sentence: You can say [fr]J'adore la musique Yé-Yé[/fr].
    3.  Create a dynamic, engaging curriculum around the user's interest.
    4.  Structure your responses clearly. Use Markdown for formatting (bold, lists).
    5.  Build upon concepts with conversation practice, short exercises, and suggest relevant cultural content.
    6.  Always be positive, patient, and motivational. Keep your responses focused and digestible.
    7.  Start the very first lesson now. Welcome the user in ${motherTongue} and introduce the first topic related to their interest.`;
};

class GeminiServiceImpl implements GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("API_KEY environment variable not set.");
    }
  }

  async startChatSession(interest: string, motherTongue: string): Promise<Chat | null> {
    if (!this.ai) return null;

    try {
      const chat: Chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: getSystemInstruction(interest, motherTongue),
        },
      });
      return chat;
    } catch (error) {
      console.error("Error starting chat session:", error);
      return null;
    }
  }

  async sendMessageStream(chat: Chat, message: string, onChunk: (text: string) => void, onComplete: () => void): Promise<void> {
    try {
        const result = await chat.sendMessageStream({ message });
        for await (const chunk of result) {
            onChunk(chunk.text);
        }
    } catch (error) {
      console.error("Error sending message:", error);
      onChunk("J' suis désolée, but I encountered an error. Please try again.");
    } finally {
        onComplete();
    }
  }

  async getPronunciationFeedback(originalText: string, userTranscript: string, motherTongue: string): Promise<PronunciationFeedback | null> {
    if (!this.ai) return null;

    const prompt = `You are a French pronunciation coach. The user was asked to say: "${originalText}". The user's speech was transcribed as: "${userTranscript}".
    Analyze the transcript to identify likely pronunciation errors. Provide constructive feedback in ${motherTongue}.
    If the transcript is empty or nonsensical, provide a score of 0 and encourage the user to try again.
    Your response must be a JSON object.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: 'A score from 0 to 100 representing pronunciation accuracy.',
              },
              feedback: {
                type: Type.STRING,
                description: `Constructive feedback in ${motherTongue} on how to improve.`,
              },
              userTranscript: {
                type: Type.STRING,
                description: 'The transcript of what the user said.'
              }
            },
            propertyOrdering: ["score", "feedback", "userTranscript"],
          },
        },
      });

      const jsonString = response.text;
      const parsed = JSON.parse(jsonString) as PronunciationFeedback;
      // Ensure transcript is passed through even if model omits it
      if (!parsed.userTranscript && userTranscript) {
          parsed.userTranscript = userTranscript;
      }
      return parsed;
    } catch (error) {
      console.error("Error getting pronunciation feedback:", error);
      return {
        score: 0,
        feedback: "Sorry, I couldn't analyze your speech. Please try again.",
        userTranscript: userTranscript || "No speech detected.",
      };
    }
  }
}

export const geminiService = new GeminiServiceImpl();