import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import { PronunciationFeedback } from '../types';
import { Icons } from './Icons';
import LoadingSpinner from './LoadingSpinner';

// Fix: Add custom type definitions for Web Speech API to resolve TypeScript errors.
// These types are not part of the standard DOM library types.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

interface PronunciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  textToPractice: string;
  motherTongue: string;
}

type Status = 'idle' | 'listening' | 'processing' | 'result' | 'error';

// Fix: Cast window to `any` to access non-standard SpeechRecognition APIs.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const PronunciationModal: React.FC<PronunciationModalProps> = ({ isOpen, onClose, textToPractice, motherTongue }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [error, setError] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'fr-FR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;
    }
  }, []);

  const handleClose = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    onClose();
  };
  
  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Sorry, your browser doesn't support speech recognition.");
      setStatus('error');
      return;
    }

    setStatus('listening');
    
    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setStatus('processing');
      const result = await geminiService.getPronunciationFeedback(textToPractice, transcript, motherTongue);
      if (result) {
        setFeedback(result);
        setStatus('result');
      } else {
        setError("Could not get feedback. Please try again.");
        setStatus('error');
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
      } else if (event.error === 'no-speech') {
        setError("No speech was detected. Please try again and speak clearly.");
      } else {
        setError("An error occurred during speech recognition. Please try again.");
      }
      setStatus('error');
    };
    
    recognition.onend = () => {
      setStatus((currentStatus) => {
          if (currentStatus === 'listening') {
              setError("I didn't catch that. Could you please try again?");
              return 'error';
          }
          return currentStatus;
      });
    };

    try {
        recognition.start();
    } catch(e) {
        console.warn("Could not start speech recognition", e);
    }
  }, [textToPractice, motherTongue]);


  useEffect(() => {
    if (isOpen) {
        setStatus('idle');
        setFeedback(null);
        setError('');
        startRecognition();
    } else {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
    
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, [isOpen, startRecognition]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderContent = () => {
    switch (status) {
      case 'listening':
        return (
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Listening...</h3>
            <div className="animate-pulse text-sky-500">
              <Icons.microphone className="w-16 h-16 mx-auto" />
            </div>
             <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Speak the phrase now.</p>
          </div>
        );
      case 'processing':
        return (
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Analyzing...</h3>
            <LoadingSpinner />
             <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Checking your pronunciation.</p>
          </div>
        );
      case 'result':
        return feedback && (
          <div>
            <h3 className="text-xl font-bold text-center mb-4">Your Results</h3>
            <div className="text-center mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">Accuracy Score</p>
              <p className={`text-6xl font-bold ${getScoreColor(feedback.score)}`}>{feedback.score}<span className="text-3xl">%</span></p>
            </div>
            <div className="space-y-4 text-sm">
                <div>
                    <p className="font-semibold text-slate-600 dark:text-slate-300">You said:</p>
                    <p className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md"><em>"{feedback.userTranscript}"</em></p>
                </div>
                 <div>
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Aélis's Feedback:</p>
                    <p className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md">{feedback.feedback}</p>
                </div>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-red-500 mb-4">Oops!</h3>
            <p>{error}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const handleTryAgain = () => {
    startRecognition();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative p-6 border border-slate-200 dark:border-slate-700">
        <button onClick={handleClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close">
            <Icons.close className="w-5 h-5"/>
        </button>

        <div className="mb-4 text-center">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Practice this phrase:</h2>
            <p className="text-lg font-bold text-sky-600 dark:text-sky-400">"{textToPractice}"</p>
        </div>

        <div className="my-6 min-h-[150px] flex items-center justify-center">
            {renderContent()}
        </div>

        {(status === 'result' || status === 'error') && (
            <div className="flex justify-center">
                <button onClick={handleTryAgain} className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 transition-colors">
                    Try Again
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationModal;
