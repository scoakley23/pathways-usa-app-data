import React from 'react';
import { useLocation } from 'react-router-dom';
import Lessons from './Lessons';
import Practice from './Practice';
import { studyTab } from '@/lib/studyRoutes';

// Study: Lessons and Practice as two tabs (/study?tab=lessons | practice).
// Each tab draws the split screen itself (StudyTop on navy, its list on a
// cream sheet); Layout gives /study the full width except during a practice
// run (?mode=…).
export default function Study(props) {
  const { search } = useLocation();
  return studyTab(search) === 'practice' ? <Practice {...props} /> : <Lessons {...props} />;
}
