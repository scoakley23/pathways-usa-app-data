import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { support } from '@/api/support';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PrimaryButton, SecondaryButton } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { REPLY_TIME, SUPPORT_MAX_LENGTH, supportFormReady } from '@/config/support';

// "Talk to a person": a short email form to the Pathways USA team. Messages
// are emailed only (src/api/support.js); nothing is saved in the app
// database. Identifiers are removed first; 3 messages a day on Supabase.

import { TALK_LINES as LINES } from './talkStrings';
const LINES_ES = {
  title: 'Hablar con una persona',
  teamIntro: 'Escriba al equipo de Pathways USA. Le podemos ayudar con la aplicación y con sus estudios.',
  privacy: 'No comparta su estatus migratorio, número A, detalles de su caso ni su dirección.',
  noLegal: 'No podemos dar consejos legales ni contestar preguntas sobre su propio caso.',
  lawyerLink: 'Hable primero con un abogado',
  replyTo: 'Le responderemos al correo electrónico de su cuenta.',
  label: 'Su mensaje',
  send: 'Enviar',
  comingSoon: 'El formulario de contacto estará disponible pronto.',
  sent: 'Gracias. Su mensaje fue enviado.',
  error: 'Lo sentimos, no se pudo enviar su mensaje. Por favor, intente más tarde.',
  limit: 'Ya envió 3 mensajes hoy. Por favor, escriba otra vez mañana.',
  done: 'Listo',
};

export default function TalkToPerson({ open, onOpenChange, userEmail, language = 'en' }) {
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'talk_person_v2', handWritten: { es: LINES_ES } });
  const t = (key) => tr(key) || LINES[key];
  const ready = supportFormReady();
  const replyLine = { reply: `We reply within ${REPLY_TIME}.` };
  const trReply = useTranslatedLines(replyLine, ready ? language : 'en', { cacheKey: `talk_reply_${REPLY_TIME}` });
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  const me = (userEmail || '').toLowerCase().trim();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | limit

  useEffect(() => {
    if (open) return;
    // Reset after the dialog closes.
    setStatus('idle');
    setMessage('');
  }, [open]);

  const send = async (e) => {
    e.preventDefault();
    const text = message.trim().slice(0, SUPPORT_MAX_LENGTH);
    if (!ready || !text || status === 'sending') return;
    setStatus('sending');
    try {
      await support.send({ message: text, replyTo: me });
      setStatus('sent');
      setMessage('');
    } catch (err) {
      setStatus(err?.limit ? 'limit' : 'error');
    }
  };

  const lawyerNote = (
    <p dir={dir} className="text-base leading-snug text-navy">
      {t('noLegal')}{' '}
      <Link to="/lawyer-first" onClick={() => onOpenChange(false)} className="font-bold underline underline-offset-4 decoration-navy/40 hover:decoration-navy">
        {t('lawyerLink')}
      </Link>
    </p>
  );

  let body;
  if (status === 'sent') {
    body = (
      <div className="flex flex-col items-center text-center gap-3 py-4" role="status">
        <span className="w-12 h-12 rounded-full bg-correct-bg text-correct grid place-items-center" aria-hidden="true">
          <CheckCircle2 className="w-7 h-7" />
        </span>
        <p dir={dir} className="text-lg font-bold">{t('sent')}</p>
        <p dir={dir} className="text-base text-muted">{trReply('reply') || replyLine.reply}</p>
        <SecondaryButton onClick={() => onOpenChange(false)} className="w-full">{t('done')}</SecondaryButton>
      </div>
    );
  } else {
    body = (
      <form onSubmit={send} className="flex flex-col gap-3">
        <p dir={dir} className="text-base leading-snug">{t('teamIntro')}</p>
        {ready ? (
          <p dir={dir} className="text-base font-bold">{trReply('reply') || replyLine.reply}</p>
        ) : (
          <p dir={dir} className="rounded-2xl bg-tint text-navy px-4 py-3 text-base font-bold">{t('comingSoon')}</p>
        )}
        <div className="rounded-2xl bg-tint px-4 py-3 space-y-2">
          <p dir={dir} className="text-base leading-snug text-navy">{t('privacy')}</p>
          {lawyerNote}
        </div>
        <label htmlFor="talk-person-message" className="text-base font-bold" dir={dir}>{t('label')}</label>
        <Textarea
          id="talk-person-message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, SUPPORT_MAX_LENGTH))}
          maxLength={SUPPORT_MAX_LENGTH}
          rows={4}
          disabled={!ready || status === 'sending'}
          aria-describedby="talk-person-count talk-person-reply"
        />
        <div className="flex flex-wrap justify-between gap-x-3 text-sm text-muted">
          <span id="talk-person-reply" dir={dir}>{t('replyTo')}</span>
          <span id="talk-person-count">{message.length}/{SUPPORT_MAX_LENGTH}</span>
        </div>
        {me && <p className="text-sm text-muted break-all -mt-2">{me}</p>}
        {(status === 'error' || status === 'limit') && (
          <p role="alert" dir={dir} className="rounded-2xl bg-not-yet-bg text-not-yet px-4 py-3 text-base font-semibold">{t(status)}</p>
        )}
        <PrimaryButton type="submit" disabled={!ready || !message.trim() || status === 'sending' || status === 'limit'} className="w-full">
          {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
          {t('send')}
        </PrimaryButton>
      </form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden p-5 gap-3 grid-cols-[minmax(0,1fr)]">
        <DialogHeader className="text-left pe-10">
          <DialogTitle dir={dir} className="text-xl font-extrabold text-navy">{t('title')}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
