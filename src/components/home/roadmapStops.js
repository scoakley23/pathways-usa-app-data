// The five stops on the road. `href` is where each opens (Today's road);
// `path`/`query` are kept for the signed-out overview (RoadmapPath).
export const ROADMAP_STOPS = [
  {
    id: 1,
    name: 'Read and write',
    desc: 'practice reading aloud, dictation, and vocabulary',
    short: 'Read sentences aloud and type what you hear.',
    path: 'Practice',
    href: '/study?tab=practice',
  },
  {
    id: 2,
    name: 'Learn',
    desc: 'study the civics lessons — history, government, and your representatives',
    short: 'Civics video lessons and your representatives.',
    path: 'Lessons',
    href: '/study?tab=lessons',
  },
  {
    id: 3,
    name: 'Speak',
    desc: 'run a mock interview with the AI practice officer',
    short: 'Practice out loud with an AI officer.',
    path: 'Practice',
    query: 'mode=interview',
    href: '/study?tab=practice&mode=interview',
  },
  {
    id: 4,
    name: 'Interview day',
    desc: 'practice the whole interview, start to finish',
    short: 'Practice the whole interview, start to finish.',
    path: 'interview-day',
    href: '/interview-day',
  },
  {
    id: 5,
    name: 'Oath day',
    desc: 'the finish line — get ready to take the Oath',
    short: 'The finish line. Take the Oath.',
    path: 'Progress',
    href: '/Progress',
  },
];