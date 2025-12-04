import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import DictationCard from '@/components/game/DictationCard';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, RotateCcw } from 'lucide-react';

export default function Practice() {
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchSentences();
  }, []);

  const fetchSentences = async () => {
    setIsLoading(true);
    try {
      // Fetch random sentences
      // For now we fetch all, in a real app we might want pagination or random selection
      const data = await base44.entities.Sentence.list();
      
      // Shuffle
      const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);
      setSentences(shuffled);
    } catch (error) {
      console.error("Error fetching sentences", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSentenceComplete = async (isCorrect) => {
    if (isCorrect) setScore(prev => prev + 1);
    
    // Save progress if user is logged in
    const user = await base44.auth.me().catch(() => null);
    if (user && sentences[currentIndex]) {
      try {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          sentence_id: sentences[currentIndex].id,
          status: isCorrect ? 'mastered' : 'practicing',
          last_practiced: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to save progress", e);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < sentences.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const restart = () => {
    setIsComplete(false);
    setCurrentIndex(0);
    setScore(0);
    fetchSentences();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading practice session...</p>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">No sentences found</h2>
        <p className="text-slate-600 mb-6">Please check back later or contact admin.</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Session Complete!</h2>
          <p className="text-slate-600 mb-8">You practiced {sentences.length} sentences.</p>
          
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <p className="text-sm text-slate-500 uppercase tracking-wide font-bold mb-1">Your Score</p>
            <p className="text-4xl font-extrabold text-blue-600">{score} / {sentences.length}</p>
          </div>

          <Button onClick={restart} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
            <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Practice Session</h2>
          <p className="text-sm text-slate-500">Sentence {currentIndex + 1} of {sentences.length}</p>
        </div>
        <div className="w-32 hidden sm:block">
           <Progress value={((currentIndex) / sentences.length) * 100} className="h-2" />
        </div>
      </div>

      <DictationCard 
        sentence={sentences[currentIndex]}
        onComplete={handleSentenceComplete}
        onNext={handleNext}
      />
    </div>
  );
}