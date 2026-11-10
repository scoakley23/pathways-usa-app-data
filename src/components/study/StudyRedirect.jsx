import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { studyPath } from '@/lib/studyRoutes';

// The old /Lessons and /Practice addresses: replace them with the matching
// Study tab, keeping the rest of the address (a practice run's ?mode=…).
export default function StudyRedirect({ tab }) {
  const { search } = useLocation();
  return <Navigate to={studyPath(tab, search)} replace />;
}
