import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText } from 'lucide-react';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { RoadIcon, ViaIcon } from '@/components/pathways/icons';
import { isStudyPath } from '@/lib/studyRoutes';

// The four places, in order. Today = what to do now, Study = Lessons and
// Practice, Vía = ask the tutor (opens the chat), N-400 = the form questions.
// The desktop header shows the same four as pills (Layout.jsx).
export const PLACES = [
  { id: 'today', label: 'Today', path: '/', icon: RoadIcon },
  { id: 'study', label: 'Study', path: '/study', icon: BookOpen },
  { id: 'via', label: 'Vía', icon: ViaIcon, tutor: true },
  { id: 'n400', label: 'N-400', path: '/n400-guide', icon: FileText },
];

export function isPlaceActive(place, pathname = '') {
  if (place.tutor) return false;
  if (place.id === 'study') return isStudyPath(pathname);
  return pathname.toLowerCase() === place.path.toLowerCase();
}

const TAB = 'relative flex flex-col items-center justify-center gap-1 min-h-[60px] px-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy';

function TabInner({ place, active, label }) {
  const Icon = place.icon;
  return (
    <>
      {/* The active tab: a 3px denim line on top. */}
      <span className={`absolute top-0 inset-x-3 h-[3px] rounded-b-full ${active ? 'bg-denim' : 'bg-transparent'}`} aria-hidden="true" />
      <Icon className="w-6 h-6" strokeWidth={2} />
      <span className="leading-none truncate max-w-full">{label}</span>
    </>
  );
}

// Phones: a cream bar with four tabs. Hidden on lesson screens and practice
// runs (Layout decides).
export default function TabBar({ pathname, onAskTutor }) {
  const { profile } = useTutorProfile();

  return (
    <nav
      aria-label="Main"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-cream border-t border-card-line pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4 max-w-lg mx-auto">
        {PLACES.map((place) => {
          const active = isPlaceActive(place, pathname);
          const look = active ? 'text-navy font-semibold' : 'text-ink-2 font-medium hover:text-ink';
          if (place.tutor) {
            return (
              <button
                key={place.id}
                type="button"
                onClick={onAskTutor}
                aria-label={`${profile.name}, AI tutor`}
                className={`${TAB} ${look}`}
              >
                <TabInner place={place} active={false} label={profile.name} />
              </button>
            );
          }
          return (
            <Link key={place.id} to={place.path} aria-current={active ? 'page' : undefined} className={`${TAB} ${look}`}>
              <TabInner place={place} active={active} label={place.label} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
