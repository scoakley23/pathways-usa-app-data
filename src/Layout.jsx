import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, Mic, CheckCircle, LogOut, Menu, Settings, GraduationCap, User, House, School, FileText, MapPin, CalendarCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import RoleSelectionDialog from '@/components/onboarding/RoleSelectionDialog';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import StudyBuddy, { openTutorChat } from '@/components/ai/StudyBuddy';
import TabBar from '@/components/pathways/TabBar';
import { PathwaysLockup } from '@/components/pathways/ui';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import TutorAvatar from '@/components/persona/TutorAvatar';
import useTutorProfile from '@/components/persona/useTutorProfile';
import useAppLanguage from '@/hooks/useAppLanguage';
import { clearTutorPhoto } from '@/lib/tutorPhoto';
import { useAuth } from '@/lib/AuthContext';
import { AutoReadContext } from '@/components/persona/useAutoRead';
import DailyPracticeReminder from '@/components/notifications/DailyPracticeReminder';
import TutorInvitePrompt from '@/components/tutor/TutorInvitePrompt';
import { Toaster } from "sonner";

// Lesson screens are "focus mode": they have a pinned Continue button, so the
// chat button and the tab bar stay off them. The tutor also reads each
// message aloud on these screens (onboarding, quick check, lessons).
const FOCUS_ROUTES = ['/quick-check', '/tutor-demo', '/learn', '/review', '/n400-coach'];

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [role, setRole] = React.useState(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
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

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const normalizedEmail = currentUser.email.toLowerCase().trim();

        // Check localStorage cache first to avoid re-showing onboarding on every navigation
        const cachedRole = localStorage.getItem(`role_${normalizedEmail}`);
        if (cachedRole) {
          setRole(cachedRole);
          setShowOnboarding(false);
          return;
        }
        
        // Look up the user's profile (creation is centralized, so duplicates are prevented at the source)
        const allProfiles = await base44.entities.PublicProfile.filter(
             { user_email: normalizedEmail }, '-created_date', 100
        );
        
        const primaryProfile = allProfiles.find(p => p.account_type) || allProfiles[0];
        if (primaryProfile) {
          if (primaryProfile.account_type) {
            localStorage.setItem(`role_${normalizedEmail}`, primaryProfile.account_type);
          }
          setRole(primaryProfile.account_type);
          setShowOnboarding(!primaryProfile.account_type);
        } else {
          // No profile - show onboarding
          setShowOnboarding(true);
        }
        
      } catch (e) {
        console.error("Auth check error:", e);
        setShowOnboarding(false);
      }
    };
    
    checkUser();
  }, [location.search]);

  const getNavItems = React.useMemo(() => {
    const items = [
      { label: 'Today', path: '/', icon: House },
    ];

    // Dynamic Navigation based on Role
    if (role === 'tutor') {
        items.push({ label: 'Tutor Portal', path: '/Tutor', icon: GraduationCap });
    } else {
        items.push({ label: 'Lessons', path: '/Lessons', icon: BookOpen });
        items.push({ label: 'Practice', path: '/Practice', icon: Mic });
        items.push({ label: 'Interview Day', path: '/interview-day', icon: CalendarCheck });
        items.push({ label: 'N-400', path: '/n400-guide', icon: FileText });
        items.push({ label: 'Progress', path: '/Progress', icon: CheckCircle });
        
        if (role === 'student' || (!role && user)) {
          items.push({ label: 'My Classroom', path: '/Tutor', icon: School });
        } else if (!user) {
          items.push({ label: 'Tutors', path: '/Tutor', icon: School });
        }
    }

    items.push({ label: 'Resources', path: '/resources', icon: MapPin });
    items.push({ label: 'Profile', path: '/Profile', icon: User });

    if (user?.role === 'admin') {
      items.push({ label: 'Admin', path: '/Admin', icon: Settings });
    }

    return items;
  }, [role, user]);

  const navItems = getNavItems;
  // The four places (tutors: Today and the Tutor Portal) sit in the header on
  // desktop and in the tab bar on phones; Menu holds the rest.
  const PRIMARY = role === 'tutor' ? ['/', '/Tutor'] : ['/', '/Lessons', '/Practice', '/n400-guide'];
  const primaryItems = navItems.filter((item) => PRIMARY.includes(item.path));
  const isCurrent = (path) => location.pathname.toLowerCase() === path.toLowerCase();

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/';
  };

  // A practice run (/Practice?mode=…) is full screen: no header, tab bar,
  // chat button or footer; the run has its own close button.
  const practiceRun = location.pathname.toLowerCase() === '/practice' && new URLSearchParams(location.search).has('mode');
  const readAloud = FOCUS_ROUTES.includes(location.pathname);
  const focusMode = readAloud || practiceRun;
  const showTabs = role !== 'tutor' && !focusMode;
  // Phones without the tab bar (tutors, lesson screens) find the four places
  // in Menu too; with the tab bar, Menu lists only the rest.
  const menuItems = navItems
    .map((item) => ({ ...item, primary: PRIMARY.includes(item.path) }))
    .filter((item) => !item.primary || !showTabs);
  const askTutor = () => (user ? openTutorChat() : base44.auth.redirectToLogin());

  return (
    <div className="min-h-screen bg-pw-page font-sans text-pw-navy">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-2xl focus:bg-pw-navy focus:text-white focus:font-bold focus:px-4 focus:py-3"
      >
        Skip to main content
      </a>
      {/* Header: the same few places on every screen size. Phones get the
          tab bar for Today · Lessons · tutor · Practice · N-400; desktop
          shows those four here plus "Ask {tutor}". Everything else is in Menu. */}
      {!practiceRun && <nav aria-label="Site" className="sticky top-0 z-50 w-full bg-pw-page/95 backdrop-blur border-b border-pw-line lg:bg-white/95">
        <div className="container mx-auto px-4 h-16 lg:h-[72px] max-w-5xl flex items-center justify-between gap-3">
          {splash ? <span /> : (
            <Link to="/" aria-label="Pathways, home" className="shrink-0 flex items-center min-h-11 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy">
              <PathwaysLockup size={30} />
            </Link>
          )}

          {/* Desktop: the four places */}
          <div className="hidden lg:flex items-center gap-1">
            {primaryItems.map((item) => (
              <Link
                key={item.path}
                to={createPageUrl(item.path.replace('/', ''))}
                aria-current={isCurrent(item.path) ? 'page' : undefined}
                className={`text-base font-semibold whitespace-nowrap transition-colors flex items-center px-4 min-h-11 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2
                  ${isCurrent(item.path) ? 'bg-pw-navy text-white' : 'text-pw-muted hover:text-pw-navy hover:bg-pw-soft'}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector compact language={language} onLanguageChange={setLanguage} className="border-pw-line" />
            {user && <NotificationCenter userEmail={user.email} />}
            {!focusMode && (
              <button
                type="button"
                onClick={askTutor}
                className="hidden lg:inline-flex items-center gap-2 min-h-11 rounded-full bg-pw-navy text-white pl-1.5 pr-4 text-base font-semibold hover:bg-pw-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
              >
                <TutorAvatar name={tutor.name} size={34} decorative className="ring-2 ring-white rounded-full" />
                Ask {tutor.name}
              </button>
            )}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="min-h-11 gap-2 px-3 font-semibold rounded-full" aria-label="Menu">
                  <Menu className="w-5 h-5" aria-hidden="true" /> <span className="hidden sm:inline">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-pw-page">
                <div className="flex flex-col gap-1 mt-8">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={createPageUrl(item.path.replace('/', ''))}
                      onClick={() => setIsOpen(false)}
                      aria-current={isCurrent(item.path) ? 'page' : undefined}
                      className={`text-lg font-semibold transition-colors flex items-center gap-3 px-4 min-h-[52px] rounded-2xl ${item.primary ? 'lg:hidden' : ''}
                        ${isCurrent(item.path) ? 'bg-white text-pw-navy shadow-raised' : 'text-pw-muted hover:bg-white hover:text-pw-navy'}`}
                    >
                      <item.icon className="w-5 h-5" aria-hidden="true" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-pw-line my-2 pt-4">
                    {user ? (
                      <Button variant="ghost" className="w-full justify-start text-pw-red-ink hover:bg-pw-red-soft" onClick={handleLogout}>
                        <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={() => base44.auth.redirectToLogin()}>
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>}

      <main id="main" tabIndex={-1} key={role || 'init'} className={`container mx-auto px-4 pt-6 max-w-5xl focus:outline-none ${showTabs ? 'pb-32 lg:pb-24' : 'pb-24'}`}>
        <AutoReadContext.Provider value={readAloud}>
        {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, { cachedUser: user, cachedRole: role });
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

      {showOnboarding && user && (
          <RoleSelectionDialog 
              isOpen={showOnboarding} 
              userEmail={user.email}
              userName={user.full_name}
              onComplete={(selectedRole) => {
                  if (user?.email) {
                    localStorage.setItem(`role_${user.email.toLowerCase().trim()}`, selectedRole);
                  }
                  setRole(selectedRole);
                  setShowOnboarding(false);
                  // New learners go straight to "Getting started" (language,
                  // tutor, where they are), then the quick check.
                  if (selectedRole === 'student') navigate('/quick-check');
              }}
          />
      )}
      {role === 'student' && !focusMode && <TutorInvitePrompt search={location.search} />}
      {!focusMode && <StudyBuddy aboveTabBar={showTabs} />}
      {showTabs && <TabBar pathname={location.pathname} onAskTutor={askTutor} />}
      {/* Interview Day writes nothing, so the daily reminder waits for another page. */}
      {location.pathname !== '/interview-day' && <DailyPracticeReminder />}
      <Toaster />
    </div>
  );
}