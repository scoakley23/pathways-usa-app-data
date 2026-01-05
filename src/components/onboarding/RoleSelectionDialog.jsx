import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { GraduationCap, School, Check, Mail, Key } from 'lucide-react';

// Mock base44 client - replace with your actual import
const base44 = {
  auth: {
    signUp: async (email, password) => ({ email }),
    signIn: async (email, password) => ({ email }),
    getCurrentUser: async () => ({ email: 'user@example.com' })
  },
  entities: {
    PublicProfile: {
      list: async (params) => [],
      create: async (data) => ({ id: '1', ...data }),
      delete: async (id) => ({})
    },
    TutorStudentRelationship: {
      list: async (params) => [],
      create: async (data) => ({ id: '1', ...data })
    }
  }
};

const toast = {
  success: (msg) => console.log('Success:', msg),
  error: (msg) => console.error('Error:', msg)
};

export default function RegistrationFlow() {
  const [step, setStep] = useState('choose'); // 'choose', 'signup', 'login'
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check URL for invite code
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('invite');
    if (code) {
      setInviteCode(code);
      setSelectedRole('student');
      toast.success('Invite code detected! Sign up to join your tutor.');
    }
  }, []);

  const handleSignUp = async () => {
    if (!email || !password || !selectedRole) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create auth account
      await base44.auth.signUp(email, password);
      
      const normalizedEmail = email.toLowerCase().trim();

      // 2. Check if invite code is valid (for students)
      let tutorEmail = null;
      if (selectedRole === 'student' && inviteCode) {
        const tutorProfiles = await base44.entities.PublicProfile.list({
          query: { invite_code: inviteCode, account_type: 'tutor' }
        });
        
        if (tutorProfiles.length === 0) {
          toast.error('Invalid invite code');
          setIsSubmitting(false);
          return;
        }
        tutorEmail = tutorProfiles[0].user_email;
      }

      // 3. Create profile
      const profileData = {
        user_email: normalizedEmail,
        display_name: displayName || normalizedEmail.split('@')[0],
        account_type: selectedRole,
        tutor_email: tutorEmail // Only set for students with invite
      };

      // Generate invite code for tutors
      if (selectedRole === 'tutor') {
        const prefix = normalizedEmail.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const random = Math.floor(1000 + Math.random() * 9000);
        profileData.invite_code = `${prefix}${random}`;
      }

      await base44.entities.PublicProfile.create(profileData);

      // 4. Create relationship if student joined via invite
      if (selectedRole === 'student' && tutorEmail) {
        await base44.entities.TutorStudentRelationship.create({
          tutor_email: tutorEmail,
          student_email: normalizedEmail,
          status: 'accepted',
          created_at: new Date().toISOString()
        });
        toast.success('Successfully joined your tutor!');
      }

      toast.success('Account created successfully!');
      
      // Redirect to appropriate dashboard
      window.location.href = selectedRole === 'tutor' ? '/tutor-dashboard' : '/student-dashboard';
      
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
      const profiles = await base44.entities.PublicProfile.list({
        query: { user_email: normalizedEmail }
      });

      if (profiles.length === 0) {
        toast.error('Profile not found. Please sign up first.');
        setIsSubmitting(false);
        return;
      }

      const role = profiles[0].account_type;
      window.location.href = role === 'tutor' ? '/tutor-dashboard' : '/student-dashboard';
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials');
      setIsSubmitting(false);
    }
  };

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-600">Sign in to your account</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <Button 
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setStep('choose')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4
              ${selectedRole === 'student' ? 'bg-blue-600' : 'bg-indigo-600'}`}>
              {selectedRole === 'student' ? 
                <School className="w-8 h-8 text-white" /> : 
                <GraduationCap className="w-8 h-8 text-white" />
              }
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Sign Up as {selectedRole === 'student' ? 'Student' : 'Tutor'}
            </h1>
            {inviteCode && (
              <p className="text-sm text-green-600 font-medium">
                Using invite code: {inviteCode}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {selectedRole === 'student' && !inviteCode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Invite Code (Optional)
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ABC1234"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter your tutor's invite code to connect with them
                </p>
              </div>
            )}

            <Button 
              onClick={handleSignUp}
              disabled={isSubmitting}
              className={`w-full h-12 ${
                selectedRole === 'student' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <button 
              onClick={() => {
                setStep('choose');
                setSelectedRole(null);
              }}
              className="text-sm text-slate-600 hover:text-slate-700"
            >
              ← Back to role selection
            </button>
            <div>
              <button 
                onClick={() => setStep('login')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-slate-900">Citizenship Learning Hub</h1>
          <p className="text-xl text-slate-600">Choose your role to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => {
              setSelectedRole('student');
              setStep('signup');
            }}
            className="group relative p-10 rounded-2xl border-2 border-slate-200 bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <School className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3">Student</h3>
            <p className="text-slate-600 text-lg">
              Practice reading, writing, and civics for your citizenship test
            </p>
          </button>

          <button 
            onClick={() => {
              setSelectedRole('tutor');
              setStep('signup');
            }}
            className="group relative p-10 rounded-2xl border-2 border-slate-200 bg-white transition-all duration-300 hover:border-indigo-400 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3">Tutor</h3>
            <p className="text-slate-600 text-lg">
              Manage students, assign practice, and track their progress
            </p>
          </button>
        </div>

        <div className="text-center pt-6">
          <button 
            onClick={() => setStep('login')}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Already have an account? <span className="text-blue-600">Sign in →</span>
          </button>
        </div>
      </div>
    </div>
  );
}