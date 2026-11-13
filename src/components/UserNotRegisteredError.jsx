import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CreamSheet, NavyTop } from '@/components/pathways/ui';

// Shown when the signed-in account isn't registered for the app (The Road:
// the title on navy, what to do on the cream sheet).
const UserNotRegisteredError = () => {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <NavyTop className="pb-14 pt-12">
        <div className="mx-auto max-w-md space-y-2">
          <AlertTriangle className="w-8 h-8 text-on-navy" aria-hidden="true" />
          <h1 className="font-display text-[34px] leading-[1.1]">Access Restricted</h1>
        </div>
      </NavyTop>
      <CreamSheet>
        <div className="mx-auto max-w-md space-y-6 pb-8">
          <p className="text-lg text-ink-2">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="p-4 bg-white border border-card-line rounded-card text-base text-ink-2">
            <p>If you believe this is an error, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </CreamSheet>
    </div>
  );
};

export default UserNotRegisteredError;
