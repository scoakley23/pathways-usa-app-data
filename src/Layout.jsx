import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, Mic, CheckCircle, LogOut, Menu, Settings, GraduationCap, User, House, School, FileText, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import RoleSelectionDialog from '@/components/onboarding/RoleSelectionDialog';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import StudyBuddy, { openTutorChat } from '@/components/ai/StudyBuddy';
import TabBar from '@/components/pathways/TabBar';
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
        items.push({ label: 'Learn', path: '/Lessons', icon: BookOpen });
        items.push({ label: 'Practice', path: '/Practice', icon: Mic });
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

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/';
  };

  const focusMode = FOCUS_ROUTES.includes(location.pathname);
  const showTabs = role !== 'tutor' && !focusMode;
  const askTutor = () => (user ? openTutorChat() : base44.auth.redirectToLogin());

  return (
    <div className="min-h-screen bg-pw-page font-sans text-pw-navy">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-2xl focus:bg-pw-navy focus:text-white focus:font-bold focus:px-4 focus:py-3"
      >
        Skip to main content
      </a>
      {/* Navigation */}
      <nav aria-label="Site" className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-pw-line">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <img 
              src="https://media.base44.com/images/public/6931bd654d327c7b2e36bfed/f90c67bf6_Screenshot2026-07-22at33716PM.png" 
              alt="Pathways Logo"
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-pw-line"
            />
            <span className="font-extrabold text-xl tracking-tight text-pw-navy">
              Pathways
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={createPageUrl(item.path.replace('/', ''))}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                className={`text-base font-bold transition-colors flex items-center gap-2 px-3 min-h-11 rounded-xl
                  ${location.pathname === item.path ? 'bg-pw-soft text-pw-navy' : 'text-pw-muted hover:text-pw-navy hover:bg-pw-soft'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
                ))}

                {user && <NotificationCenter userEmail={user.email} />}

                {user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2 text-pw-muted">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
               <Button size="sm" onClick={() => base44.auth.redirectToLogin()} className="ml-2">
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Nav */}
          <div className="lg:hidden flex items-center gap-2">
            {user && <NotificationCenter userEmail={user.email} />}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="min-h-11 gap-2 px-3 font-bold">
                  <Menu className="w-5 h-5" aria-hidden="true" /> Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-pw-page">
                <div className="flex flex-col gap-1 mt-8">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path} 
                      to={createPageUrl(item.path.replace('/', ''))}
                      onClick={() => setIsOpen(false)}
                      aria-current={location.pathname === item.path ? 'page' : undefined}
                      className={`text-lg font-bold transition-colors flex items-center gap-3 px-4 min-h-[52px] rounded-2xl
                        ${location.pathname === item.path ? 'bg-white text-pw-navy shadow-raised border-l-4 border-pw-red' : 'text-pw-muted hover:bg-white hover:text-pw-navy'}`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                   <div className="border-t border-pw-line my-2 pt-4">
                    {user ? (
                      <Button variant="ghost" className="w-full justify-start text-pw-red-ink hover:bg-pw-red-soft" onClick={handleLogout}>
                        <LogOut className="w-5 h-5 mr-3" />
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
      </nav>

      <main id="main" tabIndex={-1} key={role || 'init'} className={`container mx-auto px-4 pt-6 max-w-5xl focus:outline-none ${showTabs ? 'pb-32 lg:pb-24' : 'pb-24'}`}>
        <AutoReadContext.Provider value={focusMode}>
        {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, { cachedUser: user, cachedRole: role });
            }
            return child;
        })}
        </AutoReadContext.Provider>
      </main>

      <footer className={`border-t border-pw-line bg-white mt-8 ${showTabs ? 'pb-24 lg:pb-0' : ''}`}>
        <div className="container mx-auto px-4 py-5 max-w-5xl">
          <p className="text-sm text-center text-pw-muted">
            Pathways is an independent nonprofit education app. Not affiliated with USCIS or any government agency. Not legal advice.
          </p>
        </div>
      </footer>

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
      <DailyPracticeReminder />
      <Toaster />
    </div>
  );
}