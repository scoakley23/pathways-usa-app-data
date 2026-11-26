import React from 'react';
import { Navigate } from 'react-router-dom';
import { OLD_LESSONS_PATH } from '@/lib/studyRoutes';

// The old Lessons page merged into Course. /Lessons is redirected by App.jsx
// (STUDY_REDIRECTS); this stays so the page list keeps working.
export default function Lessons() {
  return <Navigate to={OLD_LESSONS_PATH} replace />;
}
