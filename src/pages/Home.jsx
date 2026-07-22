import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mic, PenTool, BookOpen, CheckCircle, GraduationCap, Notebook } from 'lucide-react';


export default function Home({ cachedUser }) {
  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Hero Section */}
      <section className="flex flex-col justify-center items-center text-center py-12 px-4 space-y-6 rounded-3xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A3A6D 0%, #2C5BA0 60%, #5C8BD3 100%)' }}>
        <img
          src="https://media.base44.com/images/public/6931bd654d327c7b2e36bfed/c6aa490d9_e696d8ff-522b-4687-a00d-ce15992779db.png"
          alt="Your learning journey"
          className="w-[22rem] h-[22rem] md:w-[30rem] md:h-[30rem] object-contain drop-shadow-2xl"
        />
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
            Your Pathway to <span style={{ color: '#E64A4A' }}>Citizenship</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Prepare for the US Citizenship Test with interactive lessons, practice dictation, vocabulary, and civics questions.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to={createPageUrl('Practice')}>
            <Button size="lg" className="h-14 px-8 text-lg bg-white hover:bg-blue-50 shadow-xl" style={{ color: '#1A3A6D' }}>
              Start Practicing Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 cursor-pointer hover:bg-blue-50">
            <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFF8', color: '#1A3A6D' }}>
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
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 cursor-pointer hover:bg-blue-50">
            <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#D6E4F5', color: '#2C5BA0' }}>
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
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 cursor-pointer hover:bg-blue-50">
            <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#C3D7F0', color: '#5C8BD3' }}>
                <Notebook className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Vocabulary</h3>
                <p className="text-slate-600">
                Master the official reading and writing vocabulary lists.
                </p>
            </CardContent>
            </Card>
        </Link>

        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 cursor-pointer hover:bg-blue-50">
            <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FDE8E8', color: '#E64A4A' }}>
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
    </div>
  );
}