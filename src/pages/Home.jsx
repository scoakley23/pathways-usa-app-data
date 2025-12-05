import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mic, PenTool, BookOpen, CheckCircle, GraduationCap } from 'lucide-react';
import StudyBuddy from '@/components/ai/StudyBuddy';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center py-20 px-4 space-y-8 bg-gradient-to-b from-blue-50 to-white rounded-3xl my-4">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Pathway to your <span className="text-blue-700">Future!</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Your personal learning hub for the US Citizenship Test. Practice dictation, vocabulary, and civics questions.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to={createPageUrl('Practice')}>
            <Button size="lg" className="h-14 px-8 text-lg bg-blue-700 hover:bg-blue-800 shadow-lg shadow-blue-700/20">
              Start Practicing Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 cursor-pointer hover:bg-purple-50/50">
            <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reading Practice</h3>
                <p className="text-slate-600">
                Read official sentences aloud and get instant feedback on pronunciation.
                </p>
            </CardContent>
            </Card>
        </Link>

        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 cursor-pointer hover:bg-blue-50/50">
            <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Dictation Practice</h3>
                <p className="text-slate-600">
                Listen to official audio and practice typing exactly what you hear.
                </p>
            </CardContent>
            </Card>
        </Link>

        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 cursor-pointer hover:bg-indigo-50/50">
            <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Vocabulary</h3>
                <p className="text-slate-600">
                Master the official reading and writing vocabulary lists.
                </p>
            </CardContent>
            </Card>
        </Link>

        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 cursor-pointer hover:bg-emerald-50/50">
            <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Civics Test</h3>
                <p className="text-slate-600">
                Prepare for the 100 questions with 2008 and 2025 versions.
                </p>
            </CardContent>
            </Card>
        </Link>
      </section>
      <StudyBuddy />
    </div>
  );
}