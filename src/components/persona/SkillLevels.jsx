import React from 'react';
import { BookOpen, Landmark, MessageCircle, PenLine } from 'lucide-react';
import { SKILL_COLOR, SKILL_ON, Tag } from '@/components/pathways/ui';
import { LEVELS, PRETEST_PARTS } from '@/lib/pretest';

const PARTS = {
  civics: { Icon: Landmark, en: 'Civics', es: 'Educación cívica' },
  reading: { Icon: BookOpen, en: 'Reading', es: 'Lectura' },
  writing: { Icon: PenLine, en: 'Writing', es: 'Escritura' },
  speaking: { Icon: MessageCircle, en: 'Speaking', es: 'Conversación' },
};
const TONE = { strong: 'green', getting_there: 'blue', start_here: 'red' };

export const partName = (part, language) => (language === 'es' ? PARTS[part].es : PARTS[part].en);

// The four skill levels from the quick check, in words (not just color).
export default function SkillLevels({ levels, language = 'en' }) {
  return (
    <ul className="grid gap-2">
      {PRETEST_PARTS.map((part) => {
        const { Icon } = PARTS[part];
        const level = levels?.[part];
        const label = level ? (language === 'es' ? LEVELS[level].es : LEVELS[level].label) : language === 'es' ? 'Sin revisar' : 'Not checked yet';
        return (
          <li key={part} className="flex items-center gap-3 rounded-2xl bg-white border border-pw-line px-4 py-3">
            <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${SKILL_COLOR[part]} ${SKILL_ON[part]}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="flex-1 font-bold text-pw-navy">{partName(part, language)}</span>
            <Tag tone={level ? TONE[level] : 'navy'}>{label}</Tag>
          </li>
        );
      })}
    </ul>
  );
}
