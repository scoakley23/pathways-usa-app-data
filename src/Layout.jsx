import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { auth } from '@/api/auth';
import NotificationCenter, { OPEN_NOTIFICATIONS_EVENT } from '@/components/notifications/NotificationCenter';
import BottomTabs, { TABS } from '@/components/pathways/BottomTabs';
import { PathwaysLockup } from '@/components/pathways/ui';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import useAppLanguage from '@/hooks/useAppLanguage';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import { clearTutorPhoto } from '@/lib/tutorPhoto';
import { tabFor } from '@/lib/shellRoutes';
import { rememberProgramFromUrl } from '@/lib/programLink';
import { recordActivityDay } from '@/lib/activityDay';
import { useAuth } from '@/lib/AuthContext';
import { AutoReadContext } from '@/components/persona/useAutoRead';
import DailyPracticeReminder from '@/components/notifications/DailyPracticeReminder';
import { Toaster } from "sonner";

// Lesson screens are "focus mode": they have a pinned Continue button, so the
// tab bar stays off them. The tutor also reads each
// message aloud on these screens (onboarding, quick check, lessons).
const FOCUS_ROUTES = ['/quick-check', '/tutor-demo', '/learn', '/review', '/n400-coach'];

// Pages drawn as split screens (a navy top and a cream sheet, full width):
// they bring their own padding. Home (/) is one too: Today, or the splash.
const SPLIT_ROUTES = ['/me', '/settings', '/ask', '/interview', '/study', '/n400-guide', '/resources', '/lawyer-first', '/progress', '/profile', '/studyhistory', '/dashboard', '/interview-day', '/partner', '/admin', '/admin/pilot'];

// The four tab names, translated like other screen text (Spanish by hand).
const TAB_LINES = Object.fromEntries(TABS.map((tab) => [tab.id, tab.label]));
const TAB_LINES_ES = { today: 'Hoy', course: 'Curso', interview: 'Entrevista', me: 'Yo' };

// The account whose profile was checked in this app load (one lookup, not one
// per page).
let profileChecked = null;

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [language, setLanguage] = useAppLanguage();
  const tabLine = useTranslatedLines(TAB_LINES, language, { cacheKey: 'tabs_v1', handWritten: { es: TAB_LINES_ES } });
  const tabLabels = language === 'en' ? {} : Object.fromEntries(TABS.map((tab) => [tab.id, tabLine(tab.id) || tab.label]));
  // The signed-out splash on Home shows the big stacked logo, so the header
  // leaves its small one out there.
  const splash = location.pathname === '/' && !isLoadingAuth && !isAuthenticated;

  // The tutor is always Amio now: delete any old tutor photo left on this
  // device (once per app load; cheap and harmless when there is none).
  React.useEffect(() => { clearTutorPhoto(); }, []);

  // A partner's link (?program=CODE) picks that program in Getting started;
  // it waits on this device through the sign-in.
  React.useEffect(() => { rememberProgramFromUrl(location.search); }, [location.search]);

  // Notifications open from Me (there is no bell or menu of their own).
  React.useEffect(() => {
    const open = () => setNotificationsOpen(true);
    window.addEventListener(OPEN_NOTIFICATIONS_EVENT, open);
    return () => window.removeEventListener(OPEN_NOTIFICATIONS_EVENT, open);
  }, []);

  // Pilot: the days a learner opens the app (date only, once a day), plus
  // their app language code.
  React.useEffect(() => {
    if (!user?.email) return;
    recordActivityDay(user, { entities: base44.entities, auth, language }).catch(() => {});
  }, [user, language]);

  // Everyone who signs in is a learner. The first sign-in makes their
  // profile and goes straight to "Getting started" and the quick check.
  React.useEffect(() => {
    auth.me().then(async (currentUser) => {
      setUser(currentUser);
      if (profileChecked === currentUser.email) return;
      profileChecked = currentUser.email;
      const { created } = await auth.ensureProfile(currentUser);
      if (created) navigate('/quick-check');
    }).catch(() => {});
  }, [location.search, navigate]);

  // A practice run (/study?tab=practice&mode=…) is full screen: no header,
  // tab bar or footer; the run has its own close button.
  const practiceRun = ['/practice', '/study'].includes(location.pathname.toLowerCase()) && new URLSearchParams(location.search).has('mode');
  const readAloud = FOCUS_ROUTES.includes(location.pathname);
  const focusMode = readAloud || practiceRun;
  const showTabs = !focusMode;
  // Split screens (a navy top and a cream sheet, full width) bring their own
  // padding: Today for signed-in learners, Study (practice runs too; the
  // runs not redesigned yet pad themselves in RunShell), the N-400 guide and
  // the Resource Hub.
  const splitPage = location.pathname === '/'
    || SPLIT_ROUTES.includes(location.pathname.toLowerCase());
  const activeTab = tabFor(location.pathname);

  return (
    <div className="min-h-screen bg-pw-page font-sans text-pw-navy">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[60] focus:rounded-2xl focus:bg-pw-navy focus:text-white focus:font-bold focus:px-4 focus:py-3"
      >
        Skip to main content
      </a>
      {/* A slim navy header: the Pathways mark, (desktop) the four tabs as
          pills, and the language button. Everything else lives in the tabs:
          Me has Ask Amio, Free help, Settings, Progress, Notifications,
          Partner and Admin pages, and Sign out. */}
      {!practiceRun && <nav aria-label="Site" className="sticky top-0 z-50 w-full bg-navy text-white">
        <div className="container mx-auto px-4 h-14 lg:h-[72px] max-w-5xl flex items-center justify-between gap-3">
          {splash ? <span /> : (
            <Link to="/" aria-label="Pathways, home" className="shrink-0 flex items-center min-h-11 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <PathwaysLockup size={26} tone="navy" />
            </Link>
          )}

          {/* Desktop: the four tabs */}
          {!focusMode && (
            <div className="hidden lg:flex items-center gap-1">
              {TABS.map((tab) => {
                const active = tab.id === activeTab;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    aria-current={active ? 'page' : undefined}
                    className={`relative text-base font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-2 px-4 min-h-11 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy
                      ${active ? 'bg-white text-navy' : 'text-on-navy hover:text-white hover:bg-chip-navy'}`}
                  >
                    <Icon className="w-5 h-5" /> {tabLabels[tab.id] || tab.label}
                    {tab.id === 'me' && unread > 0 && (
                      <span className="min-w-6 h-6 px-1.5 rounded-full bg-denim text-white text-xs font-bold grid place-items-center">
                        {unread}<span className="sr-only"> unread notifications</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          <LanguageSelector compact onNavy language={language} onLanguageChange={setLanguage} />
        </div>
      </nav>}
      {user && (
        <NotificationCenter
          userEmail={user.email}
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
          onUnreadChange={setUnread}
        />
      )}

      <main id="main" tabIndex={-1} className={`focus:outline-none ${splitPage ? '' : 'container mx-auto px-4 pt-6 max-w-5xl'} ${showTabs ? 'pb-32 lg:pb-24' : 'pb-24'}`}>
        <AutoReadContext.Provider value={readAloud}>
        {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, { cachedUser: user });
            }
            return child;
        })}
        </AutoReadContext.Provider>
      </main>

      {!practiceRun && <footer className={`mt-8 ${showTabs ? 'pb-24 lg:pb-0' : ''}`}>
        <p className="container mx-auto px-4 py-6 max-w-5xl text-sm text-center text-pw-muted">
          Free practice · Not affiliated with USCIS · Not legal advice
        </p>
      </footer>}

      {showTabs && (
        <BottomTabs
          active={activeTab}
          labels={tabLabels}
          dots={unread > 0 ? { me: `${unread} unread notifications` } : {}}
          className="lg:hidden"
        />
      )}
      {/* Interview Day writes nothing, so the daily reminder waits for another page. */}
      {location.pathname !== '/interview-day' && <DailyPracticeReminder />}
      <Toaster />
    </div>
  );
}