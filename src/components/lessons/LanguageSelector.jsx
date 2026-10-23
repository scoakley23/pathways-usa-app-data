import { Globe, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

// `compact`: a small pill (globe + language code) for the app header.
export default function LanguageSelector({ language, onLanguageChange, translating, compact = false, className = '' }) {
  const label = LANGUAGES.find((l) => l.value === language)?.label || language;
  return (
    <Select value={language} onValueChange={onLanguageChange} disabled={translating}>
      <SelectTrigger
        className={compact
          ? `w-auto min-h-[44px] gap-1.5 rounded-full bg-white px-3 font-semibold text-pw-navy [&>svg:last-child]:hidden ${className}`
          : `w-[160px] min-h-[44px] bg-white ${className}`}
        aria-label={compact ? `Language: ${label}` : 'Lesson language'}
      >
        {translating ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2 text-pw-navy" />
        ) : (
          <Globe className={`w-4 h-4 ${compact ? 'text-pw-navy' : 'mr-2 text-pw-muted'}`} aria-hidden="true" />
        )}
        {compact ? <span className="uppercase">{language.split('-')[0]}</span> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
