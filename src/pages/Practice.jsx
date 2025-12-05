import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, BookA, GraduationCap, Clock, ArrowRight, CheckCircle, Play } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DictationCard from '@/components/game/DictationCard';
import CivicsTestCard from '@/components/practice/CivicsTestCard';
import { toast } from "sonner";

export default function Practice() {
  const [mode, setMode] = useState('menu'); // menu, dictation, vocabulary, civics
  const [civicsVersion, setCivicsVersion] = useState('2008');
  const [content, setContent] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch pending assignments on load
  useEffect(() => {
    const loadUserAndAssignments = async () => {
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        setCurrentUser(user);
        const allAssignments = await base44.entities.Assignment.list();
        const myPending = allAssignments.filter(a => a.student_email === user.email && a.status === 'pending');
        setAssignments(myPending);
      }
    };
    loadUserAndAssignments();
  }, []);

  const startSession = async (selectedMode) => {
    setIsLoading(true);
    setMode(selectedMode);
    setCurrentIndex(0);
    setSessionComplete(false);
    
    try {
      let data = [];
      if (selectedMode === 'dictation') {
        data = await base44.entities.Sentence.list();
      } else if (selectedMode === 'vocabulary') {
        data = await base44.entities.VocabularyWord.list();
        // Transform vocab to match DictationCard expected format (text property)
        data = data.map(v => ({ ...v, text: v.word, type: 'vocabulary' }));
      } else if (selectedMode === 'civics') {
        data = await base44.entities.CivicsQuestion.list();
        data = data.filter(q => q.version === civicsVersion);
      }
      
      // Shuffle and pick 10
      const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);
      setContent(shuffled);
    } catch (error) {
      console.error("Error starting session", error);
      toast.error("Failed to start practice session");
      setMode('menu');
    } finally {
      setIsLoading(false);
    }
  };

  const startAssignment = async (assignment) => {
    setIsLoading(true);
    // Determine mode from assignment
    let mode = 'dictation';
    if (assignment.content_type === 'vocabulary') mode = 'vocabulary';
    if (assignment.content_type === 'civics_question') mode = 'civics';
    setMode(mode);
    setCurrentIndex(0);
    setSessionComplete(false);

    try {
      // Fetch the specific content
      let item;
      if (assignment.content_type === 'sentence') {
        item = await base44.entities.Sentence.list({ id: assignment.content_id }).then(r => r[0]);
      } else if (assignment.content_type === 'vocabulary') {
        const vocab = await base44.entities.VocabularyWord.list({ id: assignment.content_id }).then(r => r[0]);
        item = vocab ? { ...vocab, text: vocab.word, type: 'vocabulary' } : null;
      } else if (assignment.content_type === 'civics_question') {
        item = await base44.entities.CivicsQuestion.list({ id: assignment.content_id }).then(r => r[0]);
      }

      if (item) {
        setContent([item]); // Single item session
        // Store current assignment ID to mark complete later
        item.assignment_id = assignment.id;
      } else {
        toast.error("Content not found");
        setMode('menu');
      }
    } catch (error) {
      console.error("Error loading assignment", error);
      toast.error("Failed to load assignment");
      setMode('menu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (isSuccess) => {
    const currentItem = content[currentIndex];
    
    // Logic to save progress
    if (currentUser) {
       try {
          await base44.entities.UserProgress.create({
            user_email: currentUser.email,
            content_id: currentItem.id,
            content_type: mode === 'civics' ? 'civics_question' : (mode === 'vocabulary' ? 'vocabulary' : 'sentence'),
            status: isSuccess ? 'mastered' : 'practicing',
            last_practiced: new Date().toISOString(),
            assignment_id: currentItem.assignment_id
          });

          // If it was an assignment, mark it as completed
          if (currentItem.assignment_id) {
            await base44.entities.Assignment.update(currentItem.assignment_id, {
              status: 'completed',
              completed_date: new Date().toISOString()
            });
            toast.success("Assignment Completed!");
          }

          // Gamification update (simplified here, ideally shared logic)
          if (isSuccess) {
             const newPoints = (currentUser.points || 0) + 10;
             await base44.auth.updateMe({ points: newPoints });
          }
       } catch (e) {
         console.error("Save progress failed", e);
       }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < content.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (mode === 'menu') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Practice Dashboard</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choose your study mode to prepare for your citizenship test.
          </p>
        </div>

        {assignments.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h2 className="font-bold text-blue-900 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" /> Assignments from your Tutor
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map(a => (
                <Card key={a.id} className="cursor-pointer hover:shadow-md transition-all border-blue-100" onClick={() => startAssignment(a)}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-blue-800 text-sm capitalize">
                        {a.content_type.replace('_', ' ')} Task
                      </p>
                      <p className="text-xs text-slate-500">
                        Assigned {new Date(a.assigned_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" className="bg-blue-600 h-8">Start</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Dictation Mode */}
          <Card className="hover:shadow-xl transition-all duration-300 border-slate-200 group cursor-pointer" onClick={() => startSession('dictation')}>
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <CardTitle>Sentence Dictation</CardTitle>
              <CardDescription>
                Listen to official USCIS sentences and practice writing them correctly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Start Dictation</Button>
            </CardContent>
          </Card>

          {/* Vocabulary Mode */}
          <Card className="hover:shadow-xl transition-all duration-300 border-slate-200 group cursor-pointer" onClick={() => startSession('vocabulary')}>
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <BookA className="w-6 h-6" />
              </div>
              <CardTitle>Vocabulary Practice</CardTitle>
              <CardDescription>
                Master the official vocabulary list required for the writing test.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Practice Words</Button>
            </CardContent>
          </Card>

          {/* Civics Test Mode */}
          <Card className="hover:shadow-xl transition-all duration-300 border-slate-200 group">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex justify-between items-start">
                 <CardTitle>Civics Test</CardTitle>
                 <Badge variant="outline" className="text-xs">Q&A</Badge>
              </div>
              <CardDescription className="mb-4">
                Practice the 100 civics questions for the oral interview.
              </CardDescription>
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                 <label className="text-xs font-medium text-slate-600">Select Version:</label>
                 <Select value={civicsVersion} onValueChange={setCivicsVersion}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2008">2008 Version (Current)</SelectItem>
                        <SelectItem value="2025">2025 Version (New)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => startSession('civics')} className="w-full bg-orange-600 hover:bg-orange-700">Start Quiz</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Session Complete!</h2>
        <p className="text-slate-600">You've finished your practice session.</p>
        <Button onClick={() => setMode('menu')} className="min-w-[200px]">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setMode('menu')} className="text-slate-500">
          &larr; Exit Practice
        </Button>
        <Badge variant="outline" className="capitalize">{mode.replace('_', ' ')}</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : content.length > 0 ? (
         mode === 'civics' ? (
            <CivicsTestCard 
                question={content[currentIndex]}
                onComplete={handleComplete}
                onNext={handleNext}
            />
         ) : (
            // Shared component for Dictation (Sentences) and Vocab (Words)
            <DictationCard 
                sentence={content[currentIndex]}
                onComplete={handleComplete}
                onNext={handleNext}
            />
         )
      ) : (
         <div className="text-center py-20">
            <p className="text-slate-500">No content found for this mode.</p>
            <Button onClick={() => setMode('menu')} className="mt-4">Go Back</Button>
         </div>
      )}
    </div>
  );
}