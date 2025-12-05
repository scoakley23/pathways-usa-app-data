import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, Mic, CheckCircle, LogOut, Menu, X, Settings, GraduationCap, User, MessageSquare, Notebook, School } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import RoleSelectionDialog from '@/components/onboarding/RoleSelectionDialog';
import { Toaster } from "sonner";

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [role, setRole] = React.useState(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check for Role
        const normalizedEmail = currentUser.email.toLowerCase().trim();
        const profiles = await base44.entities.PublicProfile.list({
             query: { user_email: normalizedEmail }
        });
        
        // Handle duplicates or missing account_type
        const validProfile = profiles.find(p => p.account_type === 'student' || p.account_type === 'tutor');
        
        if (validProfile) {
            setRole(validProfile.account_type);
            // If multiple profiles exist, we might want to clean them up, but for now just picking the valid one is enough
            // to stop the dialog from showing.
            if (showOnboarding) setShowOnboarding(false);
        } else {
            // If no valid profile, show onboarding
            setShowOnboarding(true);
        }
      } catch (e) {
        // Not logged in
      }
    };
    
    checkUser();
    // Removed the event listener to prevent race conditions with eventual consistency
  }, []);

  const navItems = [
    { label: 'Home', path: '/', icon: BookOpen },
  ];

  // Dynamic Navigation based on Role
  if (role === 'tutor') {
      navItems.push({ label: 'Tutor Portal', path: '/Tutor', icon: GraduationCap });
      // Tutors don't need Practice or Progress pages
  } else {
      // Students and Guests
      navItems.push({ label: 'Practice', path: '/Practice', icon: Mic });
      navItems.push({ label: 'Progress', path: '/Progress', icon: CheckCircle });
      
      if (role === 'student' || (!role && user)) {
      // Students see "My Classroom" instead of "Tutor Portal"
      // Or we can keep the path /Tutor but rename the label
      navItems.push({ label: 'My Classroom', path: '/Tutor', icon: School });
  } else if (!user) {
      // Guest view
      navItems.push({ label: 'Tutors', path: '/Tutor', icon: School });
  }
  }

  navItems.push({ label: 'Profile', path: '/Profile', icon: User });

  // Add admin link if user is admin
  if (user?.role === 'admin') {
    navItems.push({ label: 'Admin', path: '/Admin', icon: Settings });
  }

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6931bd654d327c7b2e36bfed/1906006d3_Screenshot2025-12-04at112241PM.png" 
              alt="Citizenship Learning Hub Logo"
              className="w-12 h-12 rounded-lg shadow-md transform hover:scale-105 transition-transform object-cover"
            />
            <span className="font-bold text-xl tracking-tight text-slate-900 leading-tight">
              Citizenship<br/>
              <span className="text-blue-700 text-sm uppercase tracking-wider">Learning Hub</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <React.Fragment key={item.path}>
                <Link 
                  to={createPageUrl(item.path.replace('/', ''))}
                className={`text-sm font-medium transition-colors hover:text-blue-700 flex items-center gap-2 px-3 py-2 rounded-md
                  ${location.pathname === item.path ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                </Link>
                </React.Fragment>
                ))}
                {user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2 text-slate-600 hover:text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
               <Button size="sm" onClick={() => base44.auth.redirectToLogin()} className="ml-2 bg-blue-700 hover:bg-blue-800">
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path} 
                      to={createPageUrl(item.path.replace('/', ''))}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors flex items-center gap-3 px-4 py-3 rounded-lg
                        ${location.pathname === item.path ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                   <div className="border-t border-slate-100 my-2 pt-4">
                    {user ? (
                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button className="w-full bg-blue-700 hover:bg-blue-800" onClick={() => base44.auth.redirectToLogin()}>
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

      <main key={role || 'init'} className="container mx-auto px-4 py-8 max-w-5xl">
        {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, { cachedUser: user, cachedRole: role });
            }
            return child;
        })}
      </main>
      
      {showOnboarding && user && (
          <RoleSelectionDialog 
              isOpen={showOnboarding} 
              userEmail={user.email}
              userName={user.full_name}
              onComplete={(selectedRole) => {
                  setRole(selectedRole);
                  setShowOnboarding(false);
              }}
          />
      )}
      <Toaster />
    </div>
  );
}