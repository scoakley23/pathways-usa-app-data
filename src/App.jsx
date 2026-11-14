import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SignInScreen from '@/components/auth/SignInScreen';
import SessionNotice from '@/components/auth/SessionNotice';
import N400Guide from './pages/N400Guide';
import LawyerPage from './pages/LawyerPage';
import TutorDemo from './pages/TutorDemo';
import DesignPreview from './pages/DesignPreview';
import QuickCheck from './pages/QuickCheck';
import LearnCivics from './pages/LearnCivics';
import ReviewCivics from './pages/ReviewCivics';
import N400Coach from './pages/N400Coach';
import InterviewDay from './pages/InterviewDay';
import PilotDashboard from './components/pilot-admin/PilotDashboard';
import Study from './pages/Study';
import StudyRedirect from './components/study/StudyRedirect';
import MePage from './components/shell/MePage';
import SettingsPage from './components/shell/SettingsPage';
import InterviewPage from './components/shell/InterviewPage';
import AskAmio from './components/ai/StudyBuddy';

// Lessons and Practice are tabs of Study now; their old addresses redirect.
const STUDY_REDIRECTS = { Lessons: 'lessons', Practice: 'practice' };

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pw-line border-t-pw-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  // Base44's login states (only while the sign-in switch in src/api/auth.js
  // is off; Supabase has no "not registered" state).
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Sign in with a 6-digit email code (Supabase), or Base44's own page. */}
      <Route path="sign-in" element={<SignInScreen />} />
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={STUDY_REDIRECTS[path] ? <StudyRedirect tab={STUDY_REDIRECTS[path]} /> : (
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          )}
        />
      ))}
      {/* The app shell (Prompt 3): the Interview and Me tabs, Settings, and
          Ask Amio (under Me). The old /Profile redirects to Me. */}
      <Route path="interview" element={
        <LayoutWrapper currentPageName="Interview">
          <InterviewPage />
        </LayoutWrapper>
      } />
      <Route path="me" element={
        <LayoutWrapper currentPageName="Me">
          <MePage />
        </LayoutWrapper>
      } />
      <Route path="settings" element={
        <LayoutWrapper currentPageName="Settings">
          <SettingsPage />
        </LayoutWrapper>
      } />
      <Route path="ask" element={
        <LayoutWrapper currentPageName="AskAmio">
          <AskAmio />
        </LayoutWrapper>
      } />
      <Route path="study" element={
        <LayoutWrapper currentPageName="Study">
          <Study />
        </LayoutWrapper>
      } />
      <Route path="n400-guide" element={
        <LayoutWrapper currentPageName="N400Guide">
          <N400Guide />
        </LayoutWrapper>
      } />
      <Route path="lawyer-first" element={
        <LayoutWrapper currentPageName="LawyerPage">
          <LawyerPage />
        </LayoutWrapper>
      } />
      <Route path="resources" element={
        <LayoutWrapper currentPageName="LawyerPage">
          <LawyerPage />
        </LayoutWrapper>
      } />
      <Route path="quick-check" element={
        <LayoutWrapper currentPageName="QuickCheck">
          <QuickCheck />
        </LayoutWrapper>
      } />
      <Route path="n400-coach" element={
        <LayoutWrapper currentPageName="N400Coach">
          <N400Coach />
        </LayoutWrapper>
      } />
      <Route path="learn" element={
        <LayoutWrapper currentPageName="LearnCivics">
          <LearnCivics />
        </LayoutWrapper>
      } />
      <Route path="review" element={
        <LayoutWrapper currentPageName="ReviewCivics">
          <ReviewCivics />
        </LayoutWrapper>
      } />
      <Route path="interview-day" element={
        <LayoutWrapper currentPageName="InterviewDay">
          <InterviewDay />
        </LayoutWrapper>
      } />
      <Route path="tutor-demo" element={
        <LayoutWrapper currentPageName="TutorDemo">
          <TutorDemo />
        </LayoutWrapper>
      } />
      {/* Admins only (and local dev): the Pathways + Amio base pieces with fake data. */}
      <Route path="design-preview" element={<DesignPreview />} />
      {/* Admins only: the page itself shows "Page Not Found" to anyone else. */}
      <Route path="admin/pilot" element={
        <LayoutWrapper currentPageName="Admin">
          <PilotDashboard />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
          <SessionNotice />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App