import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageNotFound from '@/lib/PageNotFound';
import { Button, Card, Chip, Eyebrow } from '@/components/pathways/ui';
import NavyBanner from '@/components/pathways/NavyBanner';
import { StepBar, ProgressBar } from '@/components/pathways/StepBar';
import { SuccessBanner, NotYetBanner } from '@/components/pathways/ResultBanner';
import MicButton from '@/components/pathways/MicButton';
import StarsPill from '@/components/pathways/StarsPill';
import BottomTabs from '@/components/pathways/BottomTabs';
import { COLORS, HOVER } from '@/design/tokens';

// /design-preview: the Pathways + Amio base pieces (Prompt 1) with fake data,
// so they can be checked on a phone before the real screens use them.
// Admins only (anyone while running `npm run dev`). Saves nothing.

const SWATCH_TEXT = { gold: 'text-navy', page: 'text-navy', tint: 'text-navy', mid: 'text-navy', line: 'text-navy', 'on-navy': 'text-navy', 'correct-bg': 'text-navy', 'not-yet-bg': 'text-navy', sky: 'text-navy', grass: 'text-navy', tree: 'text-navy', 'stop-speak': 'text-navy', 'stop-chest': 'text-navy', 'stop-chest-border': 'text-navy', white: 'text-navy' };

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
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;
  if (user?.role !== 'admin') return <PageNotFound />;

  return (
    <div className="min-h-screen bg-page text-navy pb-28">
      <NavyBanner
        left={(
          <Link to="/" aria-label="Close" className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <X className="w-6 h-6" aria-hidden="true" />
          </Link>
        )}
        title={`Step ${step} of 5 · Teach it back`}
        subtitle="Design preview · fake data"
        right={<StarsPill count={46} />}
        extra={<StepBar total={5} current={step} />}
      />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <Section title="Step bar">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} onClick={() => setStep(n)} aria-pressed={n === step}>Step {n}</Chip>
            ))}
          </div>
        </Section>

        <Section title="Buttons">
          <Button variant="main" className="w-full">Start · +3 stars</Button>
          <Button variant="second" className="w-full">Review 5 questions</Button>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="text-link">Hear it again</Button>
            <Button variant="next">Next (older screens)</Button>
            <Button variant="main" disabled>Disabled</Button>
          </div>
          <div className="bg-navy rounded-card p-4 flex flex-wrap gap-3">
            <Button variant="main" onNavy>Main on navy</Button>
            <Button variant="second" onNavy>Second on navy</Button>
            <Button variant="link" onNavy>Link on navy</Button>
          </div>
        </Section>

        <Section title="Chips and stars">
          <div className="flex flex-wrap gap-2">
            <Chip onClick={() => {}}>Hear it again</Chip>
            <Chip onClick={() => {}}>Hint</Chip>
            <Chip onClick={() => {}}>In my language</Chip>
            <Chip>Said in your language</Chip>
            <StarsPill count={3} onNavy={false} />
          </div>
          <div className="bg-navy rounded-card p-4 flex flex-wrap gap-2">
            <Chip onNavy>Section 2 · Congress</Chip>
            <StarsPill count={46} />
          </div>
        </Section>

        <Section title="Progress">
          <ProgressBar value={8} max={26} label="8 of 26 lessons" />
          <div className="bg-navy rounded-card p-4 space-y-2">
            <ProgressBar value={1} max={2} label="Today's goal: 1 of 2 lessons" onNavy />
            <p className="text-small text-on-navy">Today’s goal: 2 lessons · 1 done</p>
          </div>
        </Section>

        <Section title="Card">
          <Card>
            <p className="text-small text-muted">Congress · lesson 3 of 7 · 5 min</p>
            <h2 className="text-title mt-1">How many senators?</h2>
            <p className="text-body text-muted mt-2">Body text is Lexend 400 at 16px. Secondary text is muted.</p>
            <p className="text-question font-bold mt-3">How many U.S. senators are there?</p>
            <p className="text-celebrate font-extrabold mt-3">Lesson complete!</p>
          </Card>
        </Section>

        <Section title="Microphone">
          <Card className="flex justify-center">
            <MicButton
              listening={listening}
              onStart={() => setListening(true)}
              onStop={() => setListening(false)}
              label="Hold and answer in English"
              onTypeInstead={() => {}}
            />
          </Card>
        </Section>

        <Section title="Result banners">
          <div className="rounded-card overflow-hidden border border-line">
            <SuccessBanner title="Great teaching!" actionLabel="Next">
              “There are one hundred.” <b>+1 star</b>
            </SuccessBanner>
          </div>
          <div className="rounded-card overflow-hidden border border-line">
            <NotYetBanner>You’ll see this one again tomorrow.</NotYetBanner>
          </div>
        </Section>

        <Section title="Colors">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries({ ...COLORS, ...HOVER }).map(([name, value]) => (
              <div key={name} className={`rounded-xl border border-line p-3 min-h-[64px] flex flex-col justify-end ${SWATCH_TEXT[name] || 'text-white'}`} style={{ background: value }}>
                <span className="text-small font-semibold">{name}</span>
                <span className="text-xs">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <BottomTabs active="course" />
    </div>
  );
}
