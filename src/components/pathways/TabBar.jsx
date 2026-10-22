import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, House, Mic } from 'lucide-react';
import TutorAvatar from '@/components/persona/TutorAvatar';
import useTutorProfile from '@/components/persona/useTutorProfile';

// Phone navigation: four places, each with one job, and the learner's tutor
// in the middle. Today = what to do now, Lessons = what to know, Practice =
// can I do it, N-400 = the form questions. The tutor (Vía's V mark, the one
// mark on the screen) opens Ask Vía.
export const TABS = [
  { label: 'Today', path: '/', icon: House },
  { label: 'Lessons', path: '/Lessons', icon: BookOpen },
  { label: 'Practice', path: '/Practice', icon: Mic },
  { label: 'N-400', path: '/n400-guide', icon: FileText },
];

function Tab({ tab, active }) {
  const Icon = tab.icon;
  return (
    <Link
      to={tab.path}
      aria-current={active ? 'page' : undefined}
      className={`relative flex flex-col items-center justify-center gap-1 min-h-[60px] px-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pw-navy rounded-xl
        ${active ? 'text-pw-navy font-bold' : 'text-pw-muted font-semibold hover:text-pw-navy'}`}
    >
      {/* The active tab gets a short navy bar (red is kept for the dots). */}
      <span className={`absolute top-0 w-6 h-1 rounded-full ${active ? 'bg-pw-navy' : 'bg-transparent'}`} aria-hidden="true" />
      <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
      <span className="leading-none truncate max-w-full">{tab.label}</span>
    </Link>
  );
}

export default function TabBar({ pathname, onAskTutor }) {
  const { profile } = useTutorProfile();
  const isActive = (path) => pathname === path || (path === '/Practice' && pathname.toLowerCase() === '/practice');
  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

  return (
    <nav
      aria-label="Main"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-pw-line pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 items-end max-w-lg mx-auto px-1">
        {left.map((tab) => <Tab key={tab.path} tab={tab} active={isActive(tab.path)} />)}
        <button
          type="button"
          onClick={onAskTutor}
          aria-label={`Ask ${profile.name}, AI tutor`}
          className="flex flex-col items-center gap-1 min-h-[60px] pb-1.5 text-sm font-bold text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pw-navy rounded-xl"
        >
          <span className="-mt-5 rounded-full bg-white p-1 shadow-lift">
            <TutorAvatar name={profile.name} size={52} decorative />
          </span>
          <span className="leading-none truncate max-w-full">{profile.name}</span>
        </button>
        {right.map((tab) => <Tab key={tab.path} tab={tab} active={isActive(tab.path)} />)}
      </div>
    </nav>
  );
}
