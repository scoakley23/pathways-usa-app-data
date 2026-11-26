import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Volume2 } from 'lucide-react';
import { askHistory } from '@/api/askHistory';
import { Card, MAIN_LINK } from '@/components/pathways/ui';
import { speakText } from '@/components/utils/textToSpeech';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { LANGUAGES } from '@/lib/languages';
import { ASK_HISTORY_LINES } from '@/components/progress/progressStrings';

// "Your questions to Amio" (/StudyHistory, Amio v2, amio-v2/one-tap-me): a
// paper page with Back and the title, then one white card per saved Ask Amio
// question (newest first): the date, the language it was asked in, the
// question and Amio's answer with Listen. Reads only. Wording in
// ASK_HISTORY_LINES (pack set "ask-history").
export default function StudyHistory() {
  const navigate = useNavigate();
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(ASK_HISTORY_LINES, language, { cacheKey: 'ask_history_v1' });
  const t = (key) => (language !== 'en' && tr(key)) || ASK_HISTORY_LINES[key] || key;
  const rtl = RTL_LANGUAGES.includes(language);
  const locale = language === 'en' ? 'en-US' : language;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    askHistory.list()
      .then((history) => setLogs(history))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const when = (log) => {
    const d = new Date(log.created_at || log.created_date);
    try {
      return `${d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`;
    } catch (e) {
      return d.toLocaleDateString();
    }
  };
  const languageName = (code) => {
    const l = LANGUAGES.find((x) => x.value === code);
    return l ? l.label : code;
  };

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="mx-auto max-w-lg px-4 pt-4 pb-8 flex flex-col gap-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/settings'))}
            aria-label={t('back')}
            className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
          <div className="min-w-0 pt-1">
            <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('title')}</h1>
            <p className="text-base text-muted" dir="auto">{t('subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-10 text-base text-muted" dir="auto">{t('loading')}</p>
        ) : logs.length === 0 ? (
          <Card padding="p-5" className="flex flex-col items-center gap-3 text-center">
            <MessageCircle className="w-8 h-8" aria-hidden="true" />
            <h2 className="text-lg font-bold" dir="auto">{t('empty_title')}</h2>
            <p className="text-base text-muted" dir="auto">{t('empty_body')}</p>
            <Link to="/ask" className={`${MAIN_LINK} w-full`}>{t('ask')}</Link>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {logs.map((log) => (
              <li key={log.id}>
                <Card padding="p-4" className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-small text-muted">
                    <span dir="auto">{when(log)}</span>
                    {log.language && log.language !== 'en' && (
                      <span className="rounded-button bg-line-soft px-2 py-0.5 font-semibold text-navy">{languageName(log.language)}</span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold leading-snug" dir="auto">“{log.question}”</h2>
                  <div className="rounded-card bg-line-soft p-4 text-base leading-relaxed whitespace-pre-line" dir="auto" lang={log.language || 'en'}>
                    {log.answer}
                  </div>
                  <button
                    type="button"
                    onClick={() => speakText(log.answer, log.language || 'en')}
                    className="self-start min-h-tap inline-flex items-center gap-2 px-1 text-base font-semibold text-denim rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
                  >
                    <Volume2 className="w-5 h-5" aria-hidden="true" /> {t('listen')}
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
