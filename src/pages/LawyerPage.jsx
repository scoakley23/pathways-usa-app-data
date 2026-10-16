import React from 'react';
import { ExternalLink, AlertTriangle, Scale, Lock, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import useLawyerChecklistTranslation from '@/hooks/useLawyerChecklistTranslation';
import { LAWYER_CHECKLIST_ITEMS, LEGAL_HELP_LINKS } from '@/components/lawyer/lawyerChecklist';

// "Talk to a lawyer first" — a plain, read-only list of situations where the
// learner should get legal help before filing. There are no checkboxes, no
// buttons, no inputs, and nothing on this page is tracked or saved.
export default function LawyerPage({ cachedUser }) {
  const isAdmin = cachedUser?.role === 'admin';
  const [language] = useAppLanguage();
  const rtl = RTL_LANGUAGES.includes((language || 'en').slice(0, 2).toLowerCase());
  const { translation, isTranslating } = useLawyerChecklistTranslation(language);
  const hasTranslation = language && language !== 'en' && translation?.length > 0;

  return (
    <div className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title="Talk to a lawyer first"
        subtitle="Before you answer hard questions or file your application."
      />

      <Card className="rounded-2xl">
        <CardContent className="p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EDF1F9', color: '#1F3A6B' }}>
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">When to get help first</h2>
          </div>
          <p className="text-slate-800 leading-relaxed">
            Most people can apply on their own. But if <strong>ANY</strong> of these are true for you, talk to a
            lawyer or accredited representative <strong>BEFORE</strong> you file. Filing with one of these issues
            can cause serious problems, including more than a denied application. You do not need to tell this
            app anything.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">If any of these is true for you</h2>
            {isTranslating && (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Translating…
              </p>
            )}
          </div>
          <ul className="space-y-4">
            {LAWYER_CHECKLIST_ITEMS.map((item, i) => (
              <li key={item.id} className="border-l-4 border-slate-300 pl-4 space-y-1">
                <p className="font-semibold text-slate-900 leading-snug">
                  {hasTranslation && translation[i] ? translation[i].text : item.text}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {hasTranslation && translation[i] ? translation[i].explanation : item.explanation}
                </p>
              </li>
            ))}
          </ul>
          {hasTranslation && (
            <p className="text-xs italic" style={{ color: '#4A5A78' }}>
              Machine translation. If anything is unclear, ask a person you trust or a lawyer.
            </p>
          )}
          {isAdmin && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm flex items-center gap-2" style={{ color: '#4A5A78' }}>
              <Lock className="w-4 h-4" />
              This list is a draft pending legal review — do not publish changes without the owner's sign-off.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-5 md:p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900">Find free or low-cost legal help</h2>
          <ul className="space-y-3">
            {LEGAL_HELP_LINKS.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline flex items-center gap-1.5"
                  style={{ color: '#1F3A6B' }}
                >
                  {link.label} <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-sm" style={{ color: '#4A5A78' }}>
                  {link.description}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-2" style={{ borderColor: '#D9483F' }}>
        <CardContent className="p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" style={{ color: '#D9483F' }} />
            <h2 className="text-xl font-extrabold text-slate-900">Who can legally help you</h2>
          </div>
          <p className="text-slate-800 leading-relaxed">
            Only lawyers and DOJ-accredited representatives can give immigration legal advice. Notarios and
            &ldquo;immigration consultants&rdquo; cannot.
          </p>
        </CardContent>
      </Card>

      <p className="text-sm leading-relaxed" style={{ color: '#4A5A78' }}>
        This page explains when to get legal help. It is not legal advice about your situation, and nothing you
        read here is saved or shared.
      </p>
    </div>
  );
}