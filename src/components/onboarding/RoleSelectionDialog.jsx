import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { GraduationCap, School, X } from 'lucide-react';
import { toast } from "sonner";
import { ensurePublicProfile } from '@/lib/profileService';

export default function RoleSelectionDialog({ isOpen, onComplete, userEmail, userName }) {
  const [step, setStep] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        
        if (!user) {
          setStep('choose');
          return;
        }

        const normalizedEmail = user.email.toLowerCase().trim();
        const profiles = await base44.entities.PublicProfile.filter(
          { user_email: normalizedEmail }, null, 1
        );

        if (profiles.length === 0 || !profiles[0].account_type) {
          setCurrentUser(user);
          setEmail(user.email);
          setDisplayName(user.full_name || '');
          setStep('select-role');
        } else {
          // Profile exists with role - close dialog immediately
          onComplete(profiles[0].account_type);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setStep('choose');
      }
    };

    checkAuth();
  }, [isOpen, onComplete]);

 // Check URL for invite code OR email invite
useEffect(() => {
  if (!isOpen) return;
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for code-based invite (e.g., ?invite=ABC1234)
  const code = urlParams.get('invite');
  if (code) {
    setInviteCode(code);
    setSelectedRole('student');
    if (!currentUser) {
      setStep('signup');
    }
    toast.success('Invite code detected! Sign up to join your tutor.');
  }
  
  // Check for email-based invite (e.g., ?tutor_invite=tutor@email.com)
  const tutorEmail = urlParams.get('tutor_invite');
  if (tutorEmail) {
    // Store for processing after login
    localStorage.setItem('pending_tutor_invite', tutorEmail);
    setSelectedRole('student');
    if (!currentUser) {
      setStep('signup');
    }
    toast.success('Tutor invitation detected! Sign up to connect.');
  }
}, [isOpen, currentUser]);

 const handleSignUp = async () => {
  if (!email || !password || !selectedRole) {
    toast.error('Please fill in all fields');
    return;
  }

  setIsSubmitting(true);
  try {
    // 1. Create auth account
    await base44.auth.signUp(email, password, {
      name: displayName || email.split('@')[0]
    });
    
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if invite code is valid (for students)
    let tutorEmail = null;
    if (selectedRole === 'student' && inviteCode) {
      console.log("=== INVITE CODE DEBUG ===");
      console.log("Looking for code:", inviteCode);
      
      // Fetch ALL profiles
      const allProfiles = await base44.entities.PublicProfile.list('-created_date', 1000);
      const cleanCode = inviteCode.replace(/\s+/g, '').toUpperCase();
      const variants = [cleanCode, cleanCode.replace(/0/g, 'O'), cleanCode.replace(/O/g, '0')];
      
      const matchingTutor = allProfiles.find(p =>
        p.account_type === 'tutor' &&
        p.invite_code &&
        variants.includes(p.invite_code.toUpperCase())
      );
      
      if (!matchingTutor) {
        toast.error('Invalid invite code. Please check and try again.');
        setIsSubmitting(false);
        return;
      }
      tutorEmail = matchingTutor.user_email;
    }

    // 3. Create profile

    const profileData = {
      user_email: normalizedEmail,
      display_name: displayName || normalizedEmail.split('@')[0],
      account_type: selectedRole
    };

    // Generate invite code for tutors
    if (selectedRole === 'tutor') {
      const prefix = normalizedEmail.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
      const random = Math.floor(1000 + Math.random() * 9000);
      profileData.invite_code = `${prefix}${random}`;
    }

    await ensurePublicProfile(normalizedEmail, profileData);

    // 4. Create relationship if student joined via invite
    if (selectedRole === 'student' && tutorEmail) {
      await base44.entities.TutorRelationship.create({
        tutor_email: tutorEmail,
        student_email: normalizedEmail,
        status: 'active',
        created_by: normalizedEmail
      });
      toast.success('Successfully joined your tutor!');
    }

    toast.success('Account created successfully!');
    onComplete(selectedRole);
    
  } catch (error) {
    console.error('Sign up error:', error);
    toast.error('Failed to create account. Please try again.');
    setIsSubmitting(false);
  }
};

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.signIn(email, password);
      
      const normalizedEmail = email.toLowerCase().trim();
      const profiles = await base44.entities.PublicProfile.filter({ user_email: normalizedEmail });

      if (profiles.length === 0 || !profiles[0].account_type) {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setStep('select-role');
        setIsSubmitting(false);
        return;
      }

      const role = profiles[0].account_type;
      toast.success('Welcome back!');
      onComplete(role);
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials');
      setIsSubmitting(false);
    }
  };

  const handleRoleSelection = async () => {
  if (!selectedRole || !currentUser) return;

  setIsSubmitting(true);
  try {
    const normalizedEmail = currentUser.email.toLowerCase().trim();

    // Handle invite code for students
    let tutorEmail = null;
    if (selectedRole === 'student' && inviteCode) {
      const allProfiles = await base44.entities.PublicProfile.list('-created_date', 1000);
      const cleanCode2 = inviteCode.replace(/\s+/g, '').toUpperCase();
      const variants2 = [cleanCode2, cleanCode2.replace(/0/g, 'O'), cleanCode2.replace(/O/g, '0')];
      
      const matchingTutor = allProfiles.find(p =>
        p.account_type === 'tutor' &&
        p.invite_code &&
        variants2.includes(p.invite_code.toUpperCase())
      );
      
      if (!matchingTutor) {
        toast.error('Invalid invite code. Please check and try again.');
        setIsSubmitting(false);
        return;
      }
      tutorEmail = matchingTutor.user_email;
    }

    // Prepare profile data
    const profileData = {
      user_email: normalizedEmail,
      display_name: displayName || currentUser.full_name || normalizedEmail.split('@')[0],
      account_type: selectedRole
    };

    if (selectedRole === 'tutor') {
      const prefix = normalizedEmail.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
      const random = Math.floor(1000 + Math.random() * 9000);
      profileData.invite_code = `${prefix}${random}`;
    }

    // Update the existing profile instead of creating a duplicate
    await ensurePublicProfile(normalizedEmail, profileData);

    // Create tutor relationship if joining via invite code
    if (selectedRole === 'student' && tutorEmail) {
      const existingRel = await base44.entities.TutorRelationship.filter(
        { student_email: normalizedEmail, tutor_email: tutorEmail }, null, 1
      );
      
      if (existingRel.length === 0) {
        await base44.entities.TutorRelationship.create({
          tutor_email: tutorEmail,
          student_email: normalizedEmail,
          status: 'active',
          created_by: normalizedEmail
        });
        toast.success('Connected with your tutor!');
      }
    }

    toast.success(`Welcome as a ${selectedRole}!`);
    onComplete(selectedRole);
    
  } catch (error) {
    console.error('Role selection error:', error);
    toast.error('Failed to set role. Please try again.');
    setIsSubmitting(false);
  }
};

  if (!isOpen || !step) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-pw-navy/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-3xl shadow-lift border border-pw-line text-pw-navy">
        {step === 'select-role' && (
          <button 
            onClick={async () => {
              await base44.auth.logout();
              window.location.reload();
            }}
            className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-pw-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
            title="Sign out"
            aria-label="Sign out"
          >
            <X className="w-5 h-5 text-pw-muted" />
          </button>
        )}

        {step === 'choose' && (
          <div className="p-6 pt-14 sm:p-12 text-center space-y-8">
            <div>
              <h1 className="text-[28px] sm:text-4xl leading-tight font-extrabold text-pw-navy mb-3">Welcome to Citizenship Learning Hub</h1>
              <p className="text-lg sm:text-xl text-pw-muted">Get started or sign in to continue</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Button 
                onClick={() => setStep('signup')}
                size="lg"
                className="flex-1 h-14 text-lg"
              >
                Create Account
              </Button>
              <Button 
                onClick={() => setStep('login')}
                size="lg"
                variant="outline"
                className="flex-1 h-14 text-lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}

        {step === 'signup' && !selectedRole && (
          <div className="p-6 pt-14 sm:p-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-[26px] sm:text-3xl leading-tight font-extrabold text-pw-navy">Choose Your Role</h2>
              <p className="text-base text-pw-muted">Are you a student or a tutor?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <button 
                onClick={() => setSelectedRole('student')}
                className="group p-6 sm:p-8 rounded-3xl border-2 border-pw-line bg-white transition-colors hover:border-pw-navy hover:bg-pw-soft text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
              >
                <div className="w-16 h-16 rounded-2xl bg-pw-blue-soft text-pw-blue-ink flex items-center justify-center mb-4 mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-pw-navy mb-2">Student</h3>
                <p className="text-base text-pw-muted">Practice for your citizenship test</p>
              </button>

              <button 
                onClick={() => setSelectedRole('tutor')}
                className="group p-6 sm:p-8 rounded-3xl border-2 border-pw-line bg-white transition-colors hover:border-pw-navy hover:bg-pw-soft text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
              >
                <div className="w-16 h-16 rounded-2xl bg-pw-teal-soft text-pw-teal-ink flex items-center justify-center mb-4 mx-auto">
                  <School className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-pw-navy mb-2">Tutor</h3>
                <p className="text-base text-pw-muted">Manage students and assignments</p>
              </button>
            </div>

            <div className="text-center">
              <button 
                onClick={() => setStep('choose')}
                className="min-h-[44px] px-4 text-base font-semibold text-pw-muted hover:text-pw-navy rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {step === 'signup' && selectedRole && (
          <div className="p-6 pt-10 sm:p-12 max-w-md mx-auto space-y-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                selectedRole === 'student' ? 'bg-pw-blue-soft' : 'bg-pw-teal-soft'
              }`}>
                {selectedRole === 'student' ? 
                  <GraduationCap className="w-8 h-8 text-pw-blue-ink" /> : 
                  <School className="w-8 h-8 text-pw-teal-ink" />
                }
              </div>
              <h2 className="text-[26px] sm:text-3xl leading-tight font-extrabold text-pw-navy">Sign Up as {selectedRole === 'student' ? 'Student' : 'Tutor'}</h2>
              {inviteCode && (
                <p className="inline-block text-sm text-pw-green-ink bg-pw-green-soft rounded-full px-3 py-1 font-bold mt-3">Using invite: {inviteCode}</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-pw-navy mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base text-pw-navy bg-white border-2 border-pw-line rounded-2xl placeholder:text-pw-muted/70 focus:outline-none focus:border-pw-navy focus-visible:ring-2 focus-visible:ring-pw-red/40"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-pw-navy mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base text-pw-navy bg-white border-2 border-pw-line rounded-2xl placeholder:text-pw-muted/70 focus:outline-none focus:border-pw-navy focus-visible:ring-2 focus-visible:ring-pw-red/40"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-pw-navy mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base text-pw-navy bg-white border-2 border-pw-line rounded-2xl placeholder:text-pw-muted/70 focus:outline-none focus:border-pw-navy focus-visible:ring-2 focus-visible:ring-pw-red/40"
                  placeholder="••••••••"
                />
              </div>

              {selectedRole === 'student' && !inviteCode && (
                <div>
                  <label className="block text-sm font-bold text-pw-navy mb-2">
                    Invite Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full min-h-[48px] px-4 py-3 text-base text-pw-navy bg-white border-2 border-pw-line rounded-2xl placeholder:text-pw-muted/70 focus:outline-none focus:border-pw-navy focus-visible:ring-2 focus-visible:ring-pw-red/40"
                    placeholder="ABC1234"
                  />
                  <p className="text-sm text-pw-muted mt-1">Enter your tutor's code to connect</p>
                </div>
              )}

              <Button 
                onClick={handleSignUp}
                disabled={isSubmitting}
                className="w-full h-[52px] text-lg"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>

            <div className="text-center space-y-1 text-base">
              <button onClick={() => setSelectedRole(null)} className="min-h-[44px] px-3 font-semibold text-pw-muted hover:text-pw-navy rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red">
                ← Choose different role
              </button>
              <div>
                <button onClick={() => setStep('login')} className="min-h-[44px] px-3 font-bold text-pw-navy underline underline-offset-4 decoration-pw-red/60 hover:decoration-pw-red rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red">
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'login' && (
          <div className="p-6 pt-10 sm:p-12 max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-[26px] sm:text-3xl leading-tight font-extrabold text-pw-navy mb-2">Welcome Back</h2>
              <p className="text-base text-pw-muted">Sign in to your account</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-pw-navy mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base text-pw-navy bg-white border-2 border-pw-line rounded-2xl placeholder:text-pw-muted/70 focus:outline-none focus:border-pw-navy focus-visible:ring-2 focus-visible:ring-pw-red/40"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-pw-navy mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base text-pw-navy bg-white border-2 border-pw-line rounded-2xl placeholder:text-pw-muted/70 focus:outline-none focus:border-pw-navy focus-visible:ring-2 focus-visible:ring-pw-red/40"
                  placeholder="••••••••"
                />
              </div>

              <Button 
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full h-[52px] text-lg"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>

            <div className="text-center space-y-1 text-base">
              <button onClick={() => setStep('choose')} className="min-h-[44px] px-3 font-semibold text-pw-muted hover:text-pw-navy rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red">
                ← Back
              </button>
              <div>
                <button onClick={() => setStep('signup')} className="min-h-[44px] px-3 font-bold text-pw-navy underline underline-offset-4 decoration-pw-red/60 hover:decoration-pw-red rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red">
                  Don't have an account? Sign up
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'select-role' && (
          <div className="p-6 pt-14 sm:p-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-[26px] sm:text-3xl leading-tight font-extrabold text-pw-navy">Complete Your Profile</h2>
              <p className="text-base text-pw-muted">Choose your role to get started</p>
              <p className="text-sm text-pw-muted break-all">Signed in as {currentUser?.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <button 
                onClick={() => setSelectedRole('student')}
                aria-pressed={selectedRole === 'student'}
                className={`group p-6 sm:p-8 rounded-3xl border-2 transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${
                  selectedRole === 'student'
                    ? 'border-pw-navy bg-pw-soft'
                    : 'border-pw-line bg-white hover:border-pw-navy/50'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto transition-colors ${
                  selectedRole === 'student' ? 'bg-pw-navy text-white' : 'bg-pw-blue-soft text-pw-blue-ink'
                }`}>
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-pw-navy mb-2">Student</h3>
                <p className="text-base text-pw-muted">Practice for your citizenship test</p>
              </button>

              <button 
                onClick={() => setSelectedRole('tutor')}
                aria-pressed={selectedRole === 'tutor'}
                className={`group p-6 sm:p-8 rounded-3xl border-2 transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${
                  selectedRole === 'tutor'
                    ? 'border-pw-navy bg-pw-soft'
                    : 'border-pw-line bg-white hover:border-pw-navy/50'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto transition-colors ${
                  selectedRole === 'tutor' ? 'bg-pw-navy text-white' : 'bg-pw-teal-soft text-pw-teal-ink'
                }`}>
                  <School className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-pw-navy mb-2">Tutor</h3>
                <p className="text-base text-pw-muted">Manage students and assignments</p>
              </button>
            </div>

            {selectedRole === 'student' && (
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-bold text-pw-navy mb-2">
                  Invite Code (Optional)
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full min-h-[48px] px-4 py-3 text-base text-pw-navy bg-white border-2 border-pw-line rounded-2xl placeholder:text-pw-muted/70 focus:outline-none focus:border-pw-navy focus-visible:ring-2 focus-visible:ring-pw-red/40"
                  placeholder="ABC1234"
                />
                <p className="text-sm text-pw-muted mt-1">Enter your tutor's code to connect</p>
              </div>
            )}

            <div className="text-center">
              <Button 
                onClick={handleRoleSelection}
                disabled={!selectedRole || isSubmitting}
                className="w-full sm:w-auto px-12 h-[52px] text-lg"
              >
                {isSubmitting ? 'Setting up...' : `Continue as ${selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : '...'}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}