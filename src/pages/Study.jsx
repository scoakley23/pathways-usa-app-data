import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Practice from './Practice';
import { studyPath, studyTab } from '@/lib/studyRoutes';

// Study is Practice only (/study?tab=practice). The old Lessons tab
// (/study?tab=lessons) merged into Course and goes to /course.
export default function Study(props) {
  const { search } = useLocation();
  if (studyTab(search) === 'lessons') return <Navigate to={studyPath('lessons', search)} replace />;
  return <Practice {...props} />;
}
