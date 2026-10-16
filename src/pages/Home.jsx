import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RoadmapHero from '@/components/home/RoadmapHero';
import RoadmapPath from '@/components/home/RoadmapPath';
import useRoadmapProgress from '@/components/home/useRoadmapProgress';
import { Mic, BookOpen, GraduationCap, Notebook, FileText, Search, ExternalLink } from 'lucide-react';


export default function Home({ cachedUser }) {
  const roadmap = useRoadmapProgress(cachedUser);
  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Hero Section */}
      <RoadmapHero roadmap={roadmap} />
      {/* Roadmap */}
      <RoadmapPath roadmap={roadmap} />

      {/* Features Section */}
      <section className="py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-5 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EDF1F9', color: '#1F3A6B' }}>
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
            <Card className="h-full hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-5 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DEE7F5', color: '#1F3A6B' }}>
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
            <Card className="h-full hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-5 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#B9C7E2', color: '#1F3A6B' }}>
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
            <Card className="h-full hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-5 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FBEAE9', color: '#D9483F' }}>
                <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Civics Test</h3>
                <p className="text-slate-600">
                Practice for the civics test. Most new applicants take the 2025 test (up to 20 questions from a list of 128). We're adding the full 2025 list now.
                </p>
            </CardContent>
            </Card>
        </Link>
      </section>

      {/* USCIS Resources Section */}
      <section className="py-8">
        <Card className="overflow-hidden rounded-2xl">
          <div className="h-2 bg-slate-900" />
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                <ExternalLink className="w-12 h-12" style={{ color: '#1F3A6B' }} />
              </div>
              <div className="flex-1 space-y-3 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Ready to file?</h2>
                <p className="text-slate-600 max-w-lg">
                  When you're ready, you'll apply and check your case on the official USCIS website. Pathways is not part of USCIS or the U.S. government.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <a
                  href="https://www.uscis.gov/citizenship/apply-for-naturalization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="lg" className="h-12 px-6 text-base whitespace-nowrap">
                    <FileText className="mr-2 w-5 h-5" /> Apply on USCIS.gov
                  </Button>
                </a>
                <a
                  href="https://egov.uscis.gov/casestatus/landing.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="lg" variant="outline" className="h-12 px-6 text-base whitespace-nowrap border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Search className="mr-2 w-5 h-5" /> Check case status on USCIS.gov
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}