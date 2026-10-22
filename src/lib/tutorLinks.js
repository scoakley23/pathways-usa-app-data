import { base44 } from '@/api/base44Client';

// Tutor ↔ student links and the tutor's view of student progress go through
// Base44 backend functions (base44/functions/tutor-link, student-progress),
// which check who is asking. The app never writes TutorRelationship itself.

async function invoke(name, payload) {
  try {
    const res = await base44.functions.invoke(name, payload);
    return res.data;
  } catch (err) {
    const message = err?.response?.data?.error || 'Something went wrong. Please try again.';
    const error = new Error(message);
    error.status = err?.response?.status;
    throw error;
  }
}

const tutorLink = (action, payload = {}) => invoke('tutor-link', { action, ...payload });

export const lookupInviteCode = (code) => tutorLink('lookupCode', { code }).then(r => r.tutor);
export const joinClassByCode = (code) => tutorLink('join', { code });
export const joinClassByEmail = (tutorEmail) => tutorLink('join', { tutorEmail });
export const requestTutor = (tutorEmail) => tutorLink('request', { tutorEmail }).then(r => r.relationship);
export const inviteStudent = (studentEmail) => tutorLink('invite', { studentEmail }).then(r => r.relationship);
export const respondToLink = (id, accept) => tutorLink('respond', { id, accept }).then(r => r.relationship);

// { [studentEmail]: { userProgress, lessonProgress, n400Progress } }, only for
// students with an active link to the signed-in tutor.
export const getStudentProgress = (studentEmails) =>
  invoke('student-progress', { studentEmails }).then(r => r.students || {});

// Who sent a link request (older links only have created_by).
export const requesterOf = (rel) => (rel?.requested_by || rel?.created_by || '').toLowerCase().trim();
