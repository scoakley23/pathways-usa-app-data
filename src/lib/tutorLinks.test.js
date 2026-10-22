import { describe, it, expect } from 'vitest';
import {
  codeVariants,
  findTutorByCode,
  canRespond,
  planJoin,
  hasActiveLink,
} from '../../base44/shared/tutorLinks.js';

const tutor = 'tutor@example.com';
const student = 'student@example.com';
const rel = (extra) => ({ tutor_email: tutor, student_email: student, status: 'pending', ...extra });

describe('invite codes', () => {
  it('ignores spaces and case and accepts O/0 swaps', () => {
    expect(codeVariants(' tut 1o23 ')).toEqual(['TUT1O23', 'TUT1023']);
    expect(codeVariants('')).toEqual([]);
  });

  it('finds only tutor profiles', () => {
    const profiles = [
      { user_email: student, account_type: 'student', invite_code: 'ABC1234' },
      { user_email: tutor, account_type: 'tutor', invite_code: 'TUT1023' },
    ];
    expect(findTutorByCode(profiles, 'tut1o23').user_email).toBe(tutor);
    expect(findTutorByCode(profiles, 'ABC1234')).toBeNull();
    expect(findTutorByCode(profiles, '')).toBeNull();
  });
});

describe('answering a request', () => {
  it('lets only the person who did not send it answer', () => {
    expect(canRespond(rel({ requested_by: tutor }), student)).toBe(true);
    expect(canRespond(rel({ requested_by: tutor }), tutor)).toBe(false);
    expect(canRespond(rel({ requested_by: student }), tutor)).toBe(true);
    expect(canRespond(rel({ requested_by: student }), student)).toBe(false);
  });

  it('falls back to created_by on older links', () => {
    expect(canRespond(rel({ created_by: tutor }), tutor)).toBe(false);
    expect(canRespond(rel({ created_by: tutor }), 'Student@Example.com')).toBe(true);
  });

  it('lets only the student answer when the sender is unknown', () => {
    expect(canRespond(rel({}), student)).toBe(true);
    expect(canRespond(rel({}), tutor)).toBe(false);
  });

  it('refuses outsiders and links that are not pending', () => {
    expect(canRespond(rel({ requested_by: tutor }), 'other@example.com')).toBe(false);
    expect(canRespond(rel({ requested_by: tutor, status: 'active' }), student)).toBe(false);
    expect(canRespond(null, student)).toBe(false);
  });
});

describe('joining and access', () => {
  it('creates, activates, or leaves a link alone', () => {
    expect(planJoin(null)).toBe('create');
    expect(planJoin({ status: 'pending' })).toBe('activate');
    expect(planJoin({ status: 'rejected' })).toBe('activate');
    expect(planJoin({ status: 'active' })).toBe('none');
  });

  it('needs an active link between this tutor and student', () => {
    expect(hasActiveLink([rel({ status: 'active' })], tutor, student)).toBe(true);
    expect(hasActiveLink([rel({ status: 'pending' })], tutor, student)).toBe(false);
    expect(hasActiveLink([rel({ status: 'active' })], 'other@example.com', student)).toBe(false);
  });
});
