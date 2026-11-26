import React, { useEffect, useState } from 'react';
import { auth } from '@/api/auth';
import PageNotFound from '@/lib/PageNotFound';
import { Button, Card, Chip, Eyebrow } from '@/components/pathways/ui';
import PageTop from '@/components/pathways/PageTop';
import RedStop from '@/components/pathways/RedStop';
import { StepBar } from '@/components/pathways/StepBar';
import { RightPanel, NotQuitePanel } from '@/components/pathways/ResultBanner';
import MicButton from '@/components/pathways/MicButton';
import { NavyChip } from '@/components/practice/RunScreen';
import BottomTabs from '@/components/pathways/BottomTabs';
import { Amio, AmioSays, AMIO_MOODS } from '@/components/pathways/Amio';
import { AmioIcon } from '@/components/pathways/icons';
import { COLORS, HOVER } from '@/design/tokens';

// /design-preview: the Amio v2 shared pieces (amio-v2/staff-screens) with
// fake data, so they can be checked on a phone.
// Admins only (anyone while running `npm run dev`). Saves nothing.

// Navy or white text on a swatch, whichever reads better (by brightness).
const swatchText = (hex) => {
  const v = String(hex).replace('#', '');
  if (v.length !== 6) return 'text-navy';
  const [r, g, b] = [0, 2, 4].map((k) => parseInt(v.slice(k, k + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.18 ? 'text-navy' : 'text-white';
};

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </section>
  );
}

export default function DesignPreview() {
  const [user, setUser] = useState(undefined);
  const [listening, setListening] = useState(false);
  const [step, setStep] = useState(2);

  useEffect(() => {
    if (import.meta.env.DEV) { setUser({ role: 'admin' }); return; }
    auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;
  if (user?.role !== 'admin') return <PageNotFound />;

  return (
    <div className="min-h-screen bg-paper text-navy pb-28">
      <main id="main">
      <PageTop tag="Design preview · fake data" title="Amio v2 pieces" subtitle="The shared pieces as they look today, to check on a phone. Saves nothing." back />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-8">
        <Section title={`Amio · ${AMIO_MOODS.length} moods`}>
          <div className="grid grid-cols-4 gap-3">
            {AMIO_MOODS.map((mood) => (
              <div key={mood} className="flex flex-col items-center gap-1">
                <Amio mood={mood} size={72} title={`Amio, ${mood}`} />
                <span className="text-small font-semibold">{mood}</span>
              </div>
            ))}
          </div>
          <div className="rounded-card bg-navy p-4 grid grid-cols-4 gap-3">
            {AMIO_MOODS.map((mood) => (
              <div key={mood} className="flex flex-col items-center gap-1">
                <Amio mood={mood} size={56} onNavy />
                <span className="text-small font-semibold text-on-navy">{mood}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-muted">
            <AmioIcon /> <span className="text-small">Tab icon (outline)</span>
          </div>
        </Section>

        <Section title="Amio says (one short line)">
          <AmioSays mood="thinking">What does the Constitution do?</AmioSays>
          <AmioSays mood="tryAgain">Not quite. Let’s look again.</AmioSays>
          <AmioSays mood="cheering" size={80}>You finished the lesson!</AmioSays>
        </Section>

        <Section title="Headlines">
          <h2 className="font-display text-[1.75rem] leading-tight">Screen title · Bricolage 800</h2>
          <p className="font-display text-[2rem] leading-tight"><RedStop>Lesson done.</RedStop></p>
          <p className="text-base">Body text is Lexend at 16px. <span className="text-muted">Secondary text is muted.</span></p>
        </Section>

        <Section title="Buttons">
          <Button variant="main" className="w-full">Start</Button>
          <Button variant="second" className="w-full">Review 5 questions</Button>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="link">Hear it again</Button>
            <Button variant="main" disabled>Disabled</Button>
          </div>
          <div className="bg-navy rounded-card p-4 flex flex-col gap-3">
            <Button variant="main" onNavy className="w-full">Main on navy (gold)</Button>
          </div>
        </Section>

        <Section title="Chips">
          <div className="flex flex-wrap gap-2">
            <Chip onClick={() => {}}>Hear it again</Chip>
            <Chip onClick={() => {}}>Hint</Chip>
            <Chip onClick={() => {}} aria-pressed>In my language</Chip>
          </div>
        </Section>

        <Section title="A speaking screen (navy)">
          <div className="rounded-card bg-navy text-white p-4 flex flex-col gap-4">
            <StepBar total={5} current={step} />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <NavyChip key={n} onClick={() => setStep(n)} pressed={n === step}>Step {n}</NavyChip>
              ))}
            </div>
            <p className="font-display text-[1.75rem] leading-tight" lang="en">How many U.S. senators are there?</p>
            <MicButton
              tone="gold"
              listening={listening}
              onStart={() => setListening(true)}
              onStop={() => setListening(false)}
              label="Tap to answer"
              listeningLabel="Tap to stop"
              onTypeInstead={() => {}}
              typeInsteadLabel="Type instead"
            />
          </div>
        </Section>

        <Section title="Result panels">
          <RightPanel title="Right!" answer="One hundred (100)" actionLabel="Continue" onAction={() => {}} />
          <NotQuitePanel
            title="Not quite"
            answerLine="The answer is:"
            answer="One hundred (100)"
            listenLabel="Listen"
            actionLabel="Say it once more"
            onAction={() => {}}
            skipLabel="Skip for now"
            onSkip={() => {}}
            note="You’ll see this one again tomorrow."
          />
        </Section>

        <Section title="Card">
          <Card padding="p-4">
            <p className="text-small text-muted">Congress · lesson 3 of 7</p>
            <h3 className="text-lg font-bold mt-1">How many senators?</h3>
            <p className="text-base text-muted mt-2">White card, 12px corners, a thin line border.</p>
          </Card>
        </Section>

        <Section title="Colors">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries({ ...COLORS, ...HOVER }).map(([name, value]) => (
              <div key={name} className={`rounded-card border border-line p-3 min-h-[64px] flex flex-col justify-end ${swatchText(value)}`} style={{ background: value }}>
                <span className="self-start rounded-[6px] bg-white px-1.5 text-small font-semibold text-navy">{name}</span>
                <span className="self-start mt-1 rounded-[6px] bg-white px-1.5 text-small text-navy">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
      </main>

      <BottomTabs active="course" />
    </div>
  );
}
