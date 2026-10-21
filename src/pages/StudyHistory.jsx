import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Calendar, Volume2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { RaisedCard } from '@/components/pathways/ui';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { speakText } from "@/components/utils/textToSpeech";

export default function StudyHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const user = await base44.auth.me();
        const history = await base44.entities.AIStudyLog.filter({ user_email: user.email }, '-created_at');
        setLogs(history);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const speak = (text, lang = 'en') => {
    speakText(text, lang);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-pw-navy">
      <PageHeader
        title="Study Question History"
        subtitle="Review your past questions and answers"
        art="speech"
      />

      {loading ? (
        <div className="text-center py-10 text-base text-pw-muted">Loading history...</div>
      ) : logs.length === 0 ? (
        <RaisedCard className="text-center py-10">
           <div className="flex justify-center mb-4">
              <span className="w-14 h-14 rounded-2xl bg-pw-blue-soft text-pw-blue-ink grid place-items-center">
                <MessageCircle className="w-7 h-7" aria-hidden="true" />
              </span>
           </div>
           <h3 className="text-xl font-extrabold">No questions yet</h3>
           <p className="text-base text-pw-muted mt-1 mb-5">Use the Study Buddy to ask questions while you practice!</p>
           <Link to={createPageUrl('Practice')} className="inline-block w-full sm:w-auto">
             <Button className="w-full sm:w-auto">Go to Practice</Button>
           </Link>
        </RaisedCard>
      ) : (
        <div className="grid gap-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
                <div className="flex justify-between items-start gap-3">
                   <div className="flex flex-wrap items-center gap-2 text-sm text-pw-muted">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      {new Date(log.created_at || log.created_date).toLocaleDateString()} 
                      <span aria-hidden="true">•</span>
                      {new Date(log.created_at || log.created_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </div>
                   {log.language && log.language !== 'en' && (
                      <Badge variant="secondary" className="uppercase">{log.language}</Badge>
                   )}
                </div>
                <CardTitle className="text-xl mt-2">
                  "{log.question}"
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0 space-y-3">
                 <div className="rounded-2xl bg-pw-soft p-4 text-base leading-relaxed text-pw-navy whitespace-pre-line">
                    {log.answer}
                 </div>
                 <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => speak(log.answer, log.language)}>
                       <Volume2 className="w-4 h-4" aria-hidden="true" /> Listen
                    </Button>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
