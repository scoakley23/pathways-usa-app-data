import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileText, HelpCircle, BookOpen, MapPin } from 'lucide-react';
import SentencesTab from '@/components/admin/SentencesTab';
import CivicsQuestionsTab from '@/components/admin/CivicsQuestionsTab';
import VocabularyWordsTab from '@/components/admin/VocabularyWordsTab';
import ResourcesTab from '@/components/admin/ResourcesTab';
import ExplanationTools from '@/components/admin/ExplanationTools';
import CurrentOfficialsTool from '@/components/admin/CurrentOfficialsTool';
import PageHeader from '@/components/PageHeader';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        // Not logged in
      } finally {
        setAuthChecked(true);
      }
    };
    checkUser();
  }, []);

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-pw-line border-t-pw-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-pw-red-soft flex items-center justify-center" aria-hidden="true">
          <AlertCircle className="w-10 h-10 text-pw-red-ink" />
        </div>
        <h2 className="text-2xl font-extrabold text-pw-navy">Access Denied</h2>
        <p className="text-base text-pw-muted">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage all practice content — sentences, civics questions, vocabulary words — and Resource Hub places."
      >
        <div className="flex flex-wrap gap-2">
          <Link to="/tutor-demo" className="inline-flex items-center justify-center min-h-[44px] rounded-2xl border-2 border-pw-navy bg-white px-4 text-base font-bold text-pw-navy hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2">
            Tutor demo
          </Link>
        </div>
      </PageHeader>

      <Tabs defaultValue="sentences">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="sentences" className="flex items-center gap-1.5 px-1 text-sm sm:text-base">
            <FileText className="w-4 h-4 hidden sm:block" aria-hidden="true" /> Sentences
          </TabsTrigger>
          <TabsTrigger value="civics" className="flex items-center gap-1.5 px-1 text-sm sm:text-base">
            <HelpCircle className="w-4 h-4 hidden sm:block" aria-hidden="true" /> Civics Q's
          </TabsTrigger>
          <TabsTrigger value="vocab" className="flex items-center gap-1.5 px-1 text-sm sm:text-base">
            <BookOpen className="w-4 h-4 hidden sm:block" aria-hidden="true" /> Vocabulary
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-1.5 px-1 text-sm sm:text-base">
            <MapPin className="w-4 h-4 hidden sm:block" aria-hidden="true" /> Places
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sentences" className="mt-6">
          <SentencesTab />
        </TabsContent>
        <TabsContent value="civics" className="mt-6">
          <CivicsQuestionsTab />
        </TabsContent>
        <TabsContent value="vocab" className="mt-6">
          <VocabularyWordsTab />
        </TabsContent>
        <TabsContent value="resources" className="mt-6">
          <ResourcesTab />
        </TabsContent>
      </Tabs>

      <ExplanationTools />

      <CurrentOfficialsTool />
    </div>
  );
}