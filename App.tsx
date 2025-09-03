import React, { useState, useCallback } from 'react';
import TopicSelector from './components/TopicSelector';
import TutorView from './components/TutorView';
import Header from './components/Header';
import { PREDEFINED_TOPICS, LANGUAGES } from './constants';

const App: React.FC = () => {
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [motherTongue, setMotherTongue] = useState<string>(LANGUAGES[0].code);

  const handleStart = useCallback((topic: string, language: string) => {
    setSelectedInterest(topic);
    setMotherTongue(language);
  }, []);
  
  const handleReset = useCallback(() => {
    setSelectedInterest(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      <Header onReset={handleReset} showReset={!!selectedInterest} />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        {!selectedInterest ? (
          <TopicSelector 
            topics={PREDEFINED_TOPICS} 
            languages={LANGUAGES}
            onStart={handleStart} 
          />
        ) : (
          <TutorView interest={selectedInterest} motherTongue={motherTongue} />
        )}
      </main>
    </div>
  );
};

export default App;
