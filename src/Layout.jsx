import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '@/api/auth';
import { profile } from '@/api/profile';
import NotificationCenter, { OPEN_NOTIFICATIONS_EVENT } from '@/components/notifications/NotificationCenter';
import BottomTabs, { TABS } from '@/components/pathways/BottomTabs';
import { Amio } from '@/components/pathways/Amio';
import useAppLanguage from '@/hooks/useAppLanguage';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import { clearTutorPhoto } from '@/lib/tutorPhoto';
import { isHeaderless, tabFor } from '@/lib/shellRoutes';
import { rememberProgramFromUrl } from '@/lib/programLink';
import { recordActivityDay } from '@/lib/activityDay';
import { useAuth } from '@/lib/AuthContext';
import { AutoReadContext } from '@/components/persona/useAutoRead';
import DailyPracticeReminder from '@/components/notifications/DailyPracticeReminder';
import { Toaster } from "sonner";

// Lesson screens are "focus mode": they have a pinned Continue button, so the
// tab bar stays off them. The tutor also reads each
// message aloud on these screens (onboarding, quick check, lessons).
// Full-screen course screens: lessons, Speak it!, Read and write, Unit
// complete, the unit practice interview and the review chest.
const CHECKPOINT_SCREEN = /^\/(course\/(lesson|n400|speak|readwrite)\/|course\/unit\/[^/]+\/(done|interview)\/?$|review-chest\/?$)/i;
const FOCUS_ROUTES = ['/quick-check', '/tutor-demo', '/learn', '/review'];

// Pages drawn as split screens (a navy top and a cream sheet, full width):
// they bring their own padding. Home (/) is one too: Today, or the splash.
const SPLIT_ROUTES = ['/quick-check', '/plan', '/done-today', '/me', '/settings', '/ask', '/interview', '/study', '/n400-guide', '/resources', '/lawyer-first', '/progress', '/profile', '/studyhistory', '/dashboard', '/interview-day', '/partner', '/admin', '/admin/pilot'];

// The four tab names, translated like other screen text (Spanish by hand).
const TAB_LINES = Object.fromEntries(TABS.map((tab) => [tab.id, tab.label]));
const FOOTER_LINES = { footer: 'Free practice · Not affiliated with USCIS · Not legal advice' };
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
  const [language] = useAppLanguage();
  const tabLine = useTranslatedLines(TAB_LINES, language, { cacheKey: 'tabs_v1', handWritten: { es: TAB_LINES_ES } });
  const tabLabels = language === 'en' ? {} : Object.fromEntries(TABS.map((tab) => [tab.id, tabLine(tab.id) || tab.label]));
  const footerLine = useTranslatedLines(FOOTER_LINES, language, { cacheKey: 'footer_v1' });
  const footer = (language !== 'en' && footerLine('footer')) || FOOTER_LINES.footer;
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
    recordActivityDay(user, { markDay: profile.markActiveDay, auth, language }).catch(() => {});
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
  const practiceMode = ['/practice', '/study'].includes(location.pathname.toLowerCase()) && new URLSearchParams(location.search).has('mode');
  // The whole-day call on Interview Day (/interview-day?call=1) is full screen too.
  const dayCall = location.pathname.toLowerCase() === '/interview-day' && new URLSearchParams(location.search).get('call') === '1';
  // A course lesson (/course/lesson/:id, Prompt 6) and the checkpoint screens
  // (Prompt 8) are full screen the same way.
  const practiceRun = practiceMode || dayCall || CHECKPOINT_SCREEN.test(location.pathname);
  const readAloud = FOCUS_ROUTES.includes(location.pathname);
  const focusMode = readAloud || practiceRun;
  // Welcome (signed-out Home, Prompt 9) is one screen with its own two buttons: no tab bar.
  const showTabs = !focusMode && !splash;
  // Split screens (a navy top and a cream sheet, full width) bring their own
  // padding: Today for signed-in learners, Study (practice runs too; the
  // runs not redesigned yet pad themselves in RunShell), the N-400 guide and
  // the Resource Hub.
  const splitPage = location.pathname === '/'
    || SPLIT_ROUTES.includes(location.pathname.toLowerCase())
    || /^\/course(\/|$)/i.test(location.pathname)
    || location.pathname === '/review-chest';
  const activeTab = tabFor(location.pathname);
  const headerless = isHeaderless(location.pathname);

  return (
    <div className="min-h-screen bg-paper font-sans text-navy">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[60] focus:rounded-2xl focus:bg-navy focus:text-white focus:font-bold focus:px-4 focus:py-3"
      >
        Skip to main content
      </a>
      {/* A slim navy header: Amio alone (no wordmark; its name is "Amio") and,
          on desktop, the four tabs. No language button: the language is in
          Settings. On phones there is no header on first open and on the four
          tabs (HEADERLESS in src/lib/shellRoutes.js); desktop keeps it for the
          tabs. Everything else lives in the tabs: Me has Ask Amio, Free help,
          Progress and Settings (Notifications, Partner, Admin, Sign out). */}
      {!practiceRun && <nav aria-label="Site" className={`sticky top-0 z-50 w-full bg-navy text-white ${headerless ? 'hidden lg:block' : ''}`}>
        <div className="container mx-auto px-4 h-14 lg:h-[72px] max-w-5xl flex items-center justify-between gap-3">
          {splash ? <span /> : (
            <Link to="/" aria-label="Amio" className="shrink-0 flex items-center min-h-11 min-w-11 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Amio size={36} onNavy />
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
                    className={`relative text-base font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-2 px-4 min-h-11 rounded-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy
                      ${active ? 'bg-white text-navy' : 'text-on-navy hover:text-white hover:bg-chip-navy'}`}
                  >
                    <Icon className="w-5 h-5" /> {tabLabels[tab.id] || tab.label}
                    {tab.id === 'me' && unread > 0 && (
                      <span className="min-w-6 h-6 px-1.5 rounded-button bg-denim text-white text-xs font-bold grid place-items-center">
                        {unread}<span className="sr-only"> unread notifications</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

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

      <main id="main" tabIndex={-1} className={`focus:outline-none ${splitPage ? '' : 'container mx-auto px-4 pt-6 max-w-5xl'} ${splash || !practiceRun ? '' : 'pb-24'}`}>
        <AutoReadContext.Provider value={readAloud}>
        {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, { cachedUser: user });
            }
            return child;
        })}
        </AutoReadContext.Provider>
      </main>

      {/* One small muted line at the end of every page, once (Welcome, the
          splash, has it on its own navy screen). Not fixed to the screen. */}
      {!practiceRun && !splash && <footer className={showTabs ? 'pb-24 lg:pb-0' : ''}>
        <p dir="auto" className="container mx-auto px-4 pt-8 pb-6 max-w-5xl text-small text-center text-muted">{footer}</p>
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