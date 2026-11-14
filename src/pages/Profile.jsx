import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { profileRedirect } from '@/lib/shellRoutes';

// The old Profile page moved (Prompt 3): the person, badges and program are
// on Me (/me), every setting and "Delete all my data" on Settings
// (/settings). Old links keep working, including their #anchors.
export default function Profile() {
  const { hash } = useLocation();
  return <Navigate to={profileRedirect(hash)} replace />;
}
