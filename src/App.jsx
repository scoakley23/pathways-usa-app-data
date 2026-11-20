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
import N400CoachRedirect from './components/n400lesson/N400CoachRedirect';
import N400LessonPage from './components/n400lesson/N400LessonPage';
import InterviewDay from './pages/InterviewDay';
import PilotDashboard from './components/pilot-admin/PilotDashboard';
import Study from './pages/Study';
import StudyRedirect from './components/study/StudyRedirect';
import MePage from './components/shell/MePage';
import SettingsPage from './components/shell/SettingsPage';
import InterviewPage from './components/shell/InterviewPage';
import WhenInterviewPage from './components/interview/WhenInterviewPage';
import AskAmio from './components/ai/StudyBuddy';
import CoursePage from './components/course/CoursePage';
import UnitGuidePage from './components/course/UnitGuidePage';
import UnitsMapPage from './components/course/UnitsMapPage';
import LessonPlayer from './components/lesson/LessonPlayer';
import PlanPage from './components/today/PlanPage';
import DoneTodayPage from './components/today/DoneTodayPage';
import SpeakItPage from './components/checkpoint/SpeakItPage';
import ReadWritePage from './components/checkpoint/ReadWritePage';
import UnitDonePage from './components/checkpoint/UnitDonePage';
import UnitInterviewPage from './components/checkpoint/UnitInterviewPage';
import LaunchScreen from '@/components/shell/LaunchScreen';
import ReviewChestPage from './components/checkpoint/ReviewChestPage';

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

  // The launch screen (Amio and the wordmark) while the sign-in is checked.
  if (isLoadingAuth) return <LaunchScreen />;

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
      {/* "When's my interview?" (Amio v2): device-only estimate. */}
      <Route path="interview/when" element={
        <LayoutWrapper currentPageName="InterviewWhen">
          <WhenInterviewPage />
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
      {/* The Course tab (Prompt 5): the journey, the unit guide, all units,
          and the 5-step lesson player (Prompt 6). */}
      <Route path="course" element={
        <LayoutWrapper currentPageName="Course">
          <CoursePage />
        </LayoutWrapper>
      } />
      <Route path="course/units" element={
        <LayoutWrapper currentPageName="CourseUnits">
          <UnitsMapPage />
        </LayoutWrapper>
      } />
      <Route path="course/unit/:unitId" element={
        <LayoutWrapper currentPageName="CourseUnit">
          <UnitGuidePage />
        </LayoutWrapper>
      } />
      <Route path="course/lesson/:lessonId" element={
        <LayoutWrapper currentPageName="CourseLesson">
          <LessonPlayer />
        </LayoutWrapper>
      } />
      <Route path="course/n400/:lessonId" element={
        <LayoutWrapper currentPageName="N400Lesson">
          <N400LessonPage />
        </LayoutWrapper>
      } />
      {/* Checkpoints (Prompt 8): Speak it!, Read and write, Unit complete,
          the unit practice interview and the review chest. */}
      <Route path="course/speak/:sectionId" element={
        <LayoutWrapper currentPageName="SpeakIt">
          <SpeakItPage />
        </LayoutWrapper>
      } />
      <Route path="course/readwrite/:stopId" element={
        <LayoutWrapper currentPageName="ReadWrite">
          <ReadWritePage />
        </LayoutWrapper>
      } />
      <Route path="course/unit/:unitId/done" element={
        <LayoutWrapper currentPageName="UnitDone">
          <UnitDonePage />
        </LayoutWrapper>
      } />
      <Route path="course/unit/:unitId/interview" element={
        <LayoutWrapper currentPageName="UnitInterview">
          <UnitInterviewPage />
        </LayoutWrapper>
      } />
      <Route path="review-chest" element={
        <LayoutWrapper currentPageName="ReviewChest">
          <ReviewChestPage />
        </LayoutWrapper>
      } />
      {/* Your plan and Done for today (Prompt 7). */}
      <Route path="plan" element={
        <LayoutWrapper currentPageName="Plan">
          <PlanPage />
        </LayoutWrapper>
      } />
      <Route path="done-today" element={
        <LayoutWrapper currentPageName="DoneToday">
          <DoneTodayPage />
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
      {/* The old N-400 coach is now the N-400 lessons. */}
      <Route path="n400-coach" element={<N400CoachRedirect />} />
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