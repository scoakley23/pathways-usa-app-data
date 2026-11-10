import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, LogOut, Settings, User, MapPin, CalendarCheck, Users, Bell, GraduationCap, SlidersHorizontal, Trash2, LogIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import NotificationCenter from '@/components/notifications/NotificationCenter';
import StudyBuddy, { openTutorChat } from '@/components/ai/StudyBuddy';
import TabBar, { PLACES, isPlaceActive } from '@/components/pathways/TabBar';
import { RoadIcon } from '@/components/pathways/icons';
import { PathwaysLockup } from '@/components/pathways/ui';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import useTutorProfile from '@/components/persona/useTutorProfile';
import useAppLanguage from '@/hooks/useAppLanguage';
import { clearTutorPhoto } from '@/lib/tutorPhoto';
import { staffPrograms } from '@/lib/partners';
import { rememberProgramFromUrl } from '@/lib/programLink';
import { recordActivityDay } from '@/lib/activityDay';
import { ensurePublicProfile } from '@/lib/profileService';
import { useAuth } from '@/lib/AuthContext';
import { AutoReadContext } from '@/components/persona/useAutoRead';
import DailyPracticeReminder from '@/components/notifications/DailyPracticeReminder';
import { Toaster } from "sonner";

// Lesson screens are "focus mode": they have a pinned Continue button, so the
// chat button and the tab bar stay off them. The tutor also reads each
// message aloud on these screens (onboarding, quick check, lessons).
const FOCUS_ROUTES = ['/quick-check', '/tutor-demo', '/learn', '/review', '/n400-coach'];

// The account whose profile was checked in this app load (one lookup, not one
// per page), and whether it works for a partner program (asked the first
// time the profile menu opens).
let profileChecked = null;
let staffChecked = null;

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [partnerStaff, setPartnerStaff] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [language, setLanguage] = useAppLanguage();
  const { profile: tutor } = useTutorProfile();
  // The signed-out splash on Home shows the big stacked logo, so the header
  // leaves its small one out there.
  const splash = location.pathname === '/' && !isLoadingAuth && !isAuthenticated;

  // Vía is always the V mark now: delete any old tutor photo left on this
  // device (once per app load; cheap and harmless when there is none).
  React.useEffect(() => { clearTutorPhoto(); }, []);

  // A partner's link (?program=CODE) picks that program in Getting started;
  // it waits on this device through the sign-in.
  React.useEffect(() => { rememberProgramFromUrl(location.search); }, [location.search]);

  // Partner program staff get "Partner" in the profile menu.
  React.useEffect(() => {
    if (!isOpen || !user?.email) return;
    if (staffChecked?.email === user.email) { setPartnerStaff(staffChecked.staff); return; }
    staffPrograms()
      .then((list) => { staffChecked = { email: user.email, staff: list.length > 0 }; setPartnerStaff(list.length > 0); })
      .catch(() => {});
  }, [isOpen, user]);

  // Pilot: the days a learner opens the app (date only, once a day), plus
  // their app language code.
  React.useEffect(() => {
    if (!user?.email) return;
    recordActivityDay(user, { entities: base44.entities, auth: base44.auth, language }).catch(() => {});
  }, [user, language]);

  // Everyone who signs in is a learner. The first sign-in makes their
  // profile and goes straight to "Getting started" and the quick check.
  React.useEffect(() => {
    base44.auth.me().then(async (currentUser) => {
      setUser(currentUser);
      if (profileChecked === currentUser.email) return;
      profileChecked = currentUser.email;
      const name = currentUser.full_name || currentUser.email.split('@')[0];
      const { created } = await ensurePublicProfile(currentUser.email, {}, { display_name: name });
      if (created) navigate('/quick-check');
    }).catch(() => {});
  }, [location.search, navigate]);

  // The profile menu: everything that is not one of the four places. Items
  // with a hash open that card on Profile.
  const menuItems = React.useMemo(() => {
    const items = [
      { label: 'Profile', path: '/Profile', icon: User },
      { label: 'Progress', path: '/Progress', icon: CheckCircle },
      { label: 'Interview Day', path: '/interview-day', icon: CalendarCheck },
      { label: 'Resources', path: '/resources', icon: MapPin },
    ];
    if (user) {
      items.push({ label: 'Notifications', action: 'notifications', icon: Bell });
      items.push({ label: 'My program', path: '/Profile#program', icon: GraduationCap });
      items.push({ label: 'Settings', path: '/Profile#settings', icon: SlidersHorizontal });
      items.push({ label: 'Delete my data', path: '/Profile#delete-data', icon: Trash2 });
    }
    if (partnerStaff) items.push({ label: 'Partner', path: '/Partner', icon: Users });
    if (user?.role === 'admin') items.push({ label: 'Admin', path: '/Admin', icon: Settings });
    return items;
  }, [user, partnerStaff]);

  const isCurrent = (path) => !path.includes('#') && location.pathname.toLowerCase() === path.toLowerCase();
  const initial = (user?.full_name || user?.email || '').trim().charAt(0).toUpperCase();

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/';
  };

  // A practice run (/study?tab=practice&mode=…) is full screen: no header, tab bar,
  // chat button or footer; the run has its own close button.
  const practiceRun = ['/practice', '/study'].includes(location.pathname.toLowerCase()) && new URLSearchParams(location.search).has('mode');
  const readAloud = FOCUS_ROUTES.includes(location.pathname);
  const focusMode = readAloud || practiceRun;
  const showTabs = !focusMode;
  // Split screens (a navy top and a cream sheet, full width) bring their own
  // padding: Today for signed-in learners, and Study (practice runs too; the
  // runs not redesigned yet pad themselves in RunShell).
  const splitPage = (location.pathname === '/' && isAuthenticated)
    || location.pathname.toLowerCase() === '/study';
  // Screens without the tab bar (lesson screens) list the places in the
  // profile menu too.
  const menuPlaces = showTabs ? [] : PLACES.filter((place) => !place.tutor);
  const askTutor = () => (user ? openTutorChat() : base44.auth.redirectToLogin());

  return (
    <div className="min-h-screen bg-pw-page font-sans text-pw-navy">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-2xl focus:bg-pw-navy focus:text-white focus:font-bold focus:px-4 focus:py-3"
      >
        Skip to main content
      </a>
      {/* Header on navy: the Pathways mark, then (desktop) the four places as
          pills, then language and the profile button. Phones get the four
          places in the tab bar; everything else is in the profile menu. */}
      {!practiceRun && <nav aria-label="Site" className="sticky top-0 z-50 w-full bg-navy text-white">
        <div className="container mx-auto px-4 h-16 lg:h-[72px] max-w-5xl flex items-center justify-between gap-3">
          {splash ? <span /> : (
            <Link to="/" aria-label="Pathways, home" className="shrink-0 flex items-center min-h-11 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <PathwaysLockup size={30} tone="navy" />
            </Link>
          )}

          {/* Desktop: the four places */}
          <div className="hidden lg:flex items-center gap-1">
            {PLACES.map((place) => {
              const active = isPlaceActive(place, location.pathname);
              const Icon = place.icon;
              const look = `text-base font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-2 px-4 min-h-11 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy
                ${active ? 'bg-white text-navy' : 'text-on-navy-2 hover:text-white hover:bg-navy-2'}`;
              if (place.tutor) {
                return focusMode ? null : (
                  <button key={place.id} type="button" onClick={askTutor} className={look} aria-label={`${tutor.name}, AI tutor`}>
                    <Icon className="w-5 h-5" /> {tutor.name}
                  </button>
                );
              }
              return (
                <Link key={place.id} to={place.path} aria-current={active ? 'page' : undefined} className={look}>
                  {place.id === 'today' && <RoadIcon className="w-5 h-5" />}
                  {place.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector compact onNavy language={language} onLanguageChange={setLanguage} />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={user ? `Your menu${unread > 0 ? `, ${unread} unread notifications` : ''}` : 'Menu'}
                  className="relative w-11 h-11 shrink-0 rounded-full bg-cream text-navy grid place-items-center text-lg font-semibold hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                >
                  {initial || <User className="w-5 h-5" aria-hidden="true" />}
                  {unread > 0 && <span className="absolute top-0 end-0 w-3 h-3 rounded-full bg-sky ring-2 ring-navy" aria-hidden="true" />}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-cream overflow-y-auto">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">Your pages, settings and sign out</SheetDescription>
                <div className="flex flex-col gap-1 mt-8">
                  {menuPlaces.map((place) => (
                    <Link
                      key={place.id}
                      to={place.path}
                      onClick={() => setIsOpen(false)}
                      aria-current={isPlaceActive(place, location.pathname) ? 'page' : undefined}
                      className={`text-lg font-semibold transition-colors flex w-full items-center gap-3 px-4 min-h-[52px] rounded-2xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy lg:hidden text-ink-2 hover:bg-white hover:text-ink`}
                    >
                      <place.icon className="w-5 h-5" />
                      {place.label}
                    </Link>
                  ))}
                  {menuPlaces.length > 0 && <div className="border-t border-card-line my-2 lg:hidden" />}
                  {menuItems.map((item) => item.action === 'notifications' ? (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => { setIsOpen(false); setNotificationsOpen(true); }}
                      className={`text-lg font-semibold transition-colors flex w-full items-center gap-3 px-4 min-h-[52px] rounded-2xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy text-ink-2 hover:bg-white hover:text-ink`}
                    >
                      <item.icon className="w-5 h-5" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {unread > 0 && <span className="min-w-7 h-7 px-2 rounded-full bg-navy text-white text-sm font-semibold grid place-items-center">{unread}<span className="sr-only"> unread</span></span>}
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      aria-current={isCurrent(item.path) ? 'page' : undefined}
                      className={`text-lg font-semibold transition-colors flex w-full items-center gap-3 px-4 min-h-[52px] rounded-2xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy
                        ${isCurrent(item.path) ? 'bg-white text-ink' : 'text-ink-2 hover:bg-white hover:text-ink'}`}
                    >
                      <item.icon className="w-5 h-5" aria-hidden="true" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-card-line my-2 pt-2">
                    {user ? (
                      <button type="button" onClick={handleLogout} className={`text-lg font-semibold transition-colors flex w-full items-center gap-3 px-4 min-h-[52px] rounded-2xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy text-ink hover:bg-white`}>
                        <LogOut className="w-5 h-5" aria-hidden="true" />
                        Sign out
                      </button>
                    ) : (
                      <button type="button" onClick={() => base44.auth.redirectToLogin()} className={`text-lg font-semibold transition-colors flex w-full items-center gap-3 px-4 min-h-[52px] rounded-2xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy bg-navy text-white hover:bg-navy-deep justify-center`}>
                        <LogIn className="w-5 h-5" aria-hidden="true" />
                        Sign in
                      </button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            {user && (
              <NotificationCenter
                userEmail={user.email}
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
                onUnreadChange={setUnread}
              />
            )}
          </div>
        </div>
      </nav>}

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

      {!focusMode && <StudyBuddy />}
      {showTabs && <TabBar pathname={location.pathname} onAskTutor={askTutor} />}
      {/* Interview Day writes nothing, so the daily reminder waits for another page. */}
      {location.pathname !== '/interview-day' && <DailyPracticeReminder />}
      <Toaster />
    </div>
  );
}