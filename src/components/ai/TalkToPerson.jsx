import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PrimaryButton, SecondaryButton, QuietButton } from '@/components/pathways/ui';
import ChatInterface from '@/components/chat/ChatInterface';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { REPLY_TIME, SUPPORT_EMAIL, SUPPORT_MAX_LENGTH, SUPPORT_SUBJECT, supportFormReady } from '@/config/support';

// "Talk to a person": a message to the learner's human tutor (My Classroom)
// when they have one, otherwise a short email form to the Pathways USA team.
// Form messages are emailed only; nothing is saved in the app database.

const LINES = {
  title: 'Talk to a person',
  tutorIntro: 'You have a tutor in My Classroom. You can send them a message.',
  messageTutor: 'Message your tutor',
  tutorNote: "Your tutor sees these messages. Don't share your immigration status, A-number, case details, or address. Your tutor can't give legal advice.",
  teamIntro: 'Write to the Pathways USA team. We can help with the app and with studying.',
  privacy: "Don't share your immigration status, A-number, case details, or address.",
  noLegal: "We can't give legal advice or answer questions about your own case.",
  lawyerLink: 'Talk to a lawyer first',
  replyTo: "We'll reply to your account email.",
  label: 'Your message',
  send: 'Send',
  comingSoon: 'Contact form coming soon.',
  sent: 'Thank you. Your message was sent.',
  error: "Sorry, your message couldn't be sent. Please try again later.",
  back: 'Back',
  done: 'Done',
};
const LINES_ES = {
  title: 'Hablar con una persona',
  tutorIntro: 'Usted tiene un tutor en Mi clase. Le puede enviar un mensaje.',
  messageTutor: 'Escribir a su tutor',
  tutorNote: 'Su tutor ve estos mensajes. No comparta su estatus migratorio, número A, detalles de su caso ni su dirección. Su tutor no puede dar consejos legales.',
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
  back: 'Volver',
  done: 'Listo',
};

export default function TalkToPerson({ open, onOpenChange, userEmail, language = 'en' }) {
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'talk_person_v1', handWritten: { es: LINES_ES } });
  const t = (key) => tr(key) || LINES[key];
  const ready = supportFormReady();
  const replyLine = { reply: `We reply within ${REPLY_TIME}.` };
  const trReply = useTranslatedLines(replyLine, ready ? language : 'en', { cacheKey: `talk_reply_${REPLY_TIME}` });
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  const me = (userEmail || '').toLowerCase().trim();
  const [tutors, setTutors] = useState(null); // null = loading
  const [chatWith, setChatWith] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  useEffect(() => {
    if (!open || !me) return;
    let active = true;
    setTutors(null);
    setChatWith(null);
    base44.entities.TutorRelationship.filter({ student_email: me })
      .then((rels) => {
        if (!active) return;
        const emails = (rels || []).filter((r) => r.status === 'active' && r.tutor_email).map((r) => r.tutor_email);
        setTutors([...new Set(emails)]);
      })
      .catch(() => { if (active) setTutors([]); });
    return () => { active = false; };
  }, [open, me]);

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
      await base44.integrations.Core.SendEmail({
        to: SUPPORT_EMAIL,
        subject: SUPPORT_SUBJECT,
        from_name: 'Pathways USA',
        body: `${text}\n\n---\nReply to: ${me}\nSent from the "Talk to a person" form in the Pathways USA app. This message is not stored in the app.`,
      });
      setStatus('sent');
      setMessage('');
    } catch (err) {
      setStatus('error');
    }
  };

  const lawyerNote = (
    <p dir={dir} className="text-base leading-snug text-pw-navy">
      {t('noLegal')}{' '}
      <Link to="/lawyer-first" onClick={() => onOpenChange(false)} className="font-bold underline underline-offset-4 decoration-pw-red/60 hover:decoration-pw-red">
        {t('lawyerLink')}
      </Link>
    </p>
  );

  let body;
  if (tutors === null) {
    body = (
      <div className="flex justify-center py-8" role="status" aria-label="Loading">
        <Loader2 className="w-6 h-6 animate-spin text-pw-muted" />
      </div>
    );
  } else if (chatWith) {
    body = (
      <div className="flex flex-col gap-3 min-h-0 min-w-0 w-full">
        <QuietButton onClick={() => setChatWith(null)} className="self-start -ml-3">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" /> {t('back')}
        </QuietButton>
        <p dir={dir} className="text-base leading-snug text-pw-muted">{t('tutorNote')}</p>
        <div className="h-[380px] max-h-[55vh] min-h-0 min-w-0 w-full overflow-hidden">
          <ChatInterface currentUserEmail={me} otherUserEmail={chatWith} />
        </div>
      </div>
    );
  } else if (tutors.length > 0) {
    body = (
      <div className="flex flex-col gap-3">
        <p dir={dir} className="text-base leading-snug">{t('tutorIntro')}</p>
        {tutors.map((email) => (
          <PrimaryButton key={email} onClick={() => setChatWith(email)} className="w-full flex-col !gap-0 py-2">
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="w-5 h-5" aria-hidden="true" /> {t('messageTutor')}
            </span>
            {tutors.length > 1 && <span className="text-sm font-semibold text-white/80 break-all">{email}</span>}
          </PrimaryButton>
        ))}
        <p dir={dir} className="text-base leading-snug text-pw-muted">{t('tutorNote')}</p>
        {lawyerNote}
      </div>
    );
  } else if (status === 'sent') {
    body = (
      <div className="flex flex-col items-center text-center gap-3 py-4" role="status">
        <span className="w-12 h-12 rounded-full bg-pw-green-soft text-pw-green-ink grid place-items-center" aria-hidden="true">
          <CheckCircle2 className="w-7 h-7" />
        </span>
        <p dir={dir} className="text-lg font-bold">{t('sent')}</p>
        <p dir={dir} className="text-base text-pw-muted">{trReply('reply') || replyLine.reply}</p>
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
          <p dir={dir} className="rounded-2xl bg-pw-blue-soft text-pw-blue-ink px-4 py-3 text-base font-bold">{t('comingSoon')}</p>
        )}
        <div className="rounded-2xl bg-pw-soft px-4 py-3 space-y-2">
          <p dir={dir} className="text-base leading-snug text-pw-navy">{t('privacy')}</p>
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
        <div className="flex flex-wrap justify-between gap-x-3 text-sm text-pw-muted">
          <span id="talk-person-reply" dir={dir}>{t('replyTo')}</span>
          <span id="talk-person-count">{message.length}/{SUPPORT_MAX_LENGTH}</span>
        </div>
        {me && <p className="text-sm text-pw-muted break-all -mt-2">{me}</p>}
        {status === 'error' && (
          <p role="alert" dir={dir} className="rounded-2xl bg-pw-red-soft text-pw-red-ink px-4 py-3 text-base font-semibold">{t('error')}</p>
        )}
        <PrimaryButton type="submit" disabled={!ready || !message.trim() || status === 'sending'} className="w-full">
          {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
          {t('send')}
        </PrimaryButton>
      </form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden p-5 gap-3 grid-cols-[minmax(0,1fr)]">
        <DialogHeader className="text-left pr-10">
          <DialogTitle dir={dir} className="text-xl font-extrabold text-pw-navy">{t('title')}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
