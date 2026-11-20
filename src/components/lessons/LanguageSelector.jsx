import { Globe, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

// `compact`: a small button (globe + the language's own name, e.g. "Español")
// for Settings; `onNavy` styles it for a navy background. No all-caps codes.
export default function LanguageSelector({ language, onLanguageChange, translating, compact = false, onNavy = false, className = '' }) {
  const label = LANGUAGES.find((l) => l.value === language)?.label || language;
  return (
    <Select value={language} onValueChange={onLanguageChange} disabled={translating}>
      <SelectTrigger
        className={compact
          ? `w-auto min-h-[44px] gap-1.5 rounded-button px-3 font-semibold [&>svg:last-child]:hidden ${onNavy ? 'bg-chip-navy border-chip-navy text-white focus:ring-white focus:ring-offset-navy' : 'bg-white text-navy'} ${className}`
          : `w-[160px] min-h-[44px] bg-white ${className}`}
        aria-label={compact ? `Language: ${label}` : 'Lesson language'}
      >
        {translating ? (
          <Loader2 className={`w-4 h-4 animate-spin me-2 ${onNavy ? 'text-white' : 'text-navy'}`} />
        ) : (
          <Globe className={`w-4 h-4 ${compact ? (onNavy ? 'text-white' : 'text-navy') : 'me-2 text-muted'}`} aria-hidden="true" />
        )}
        {compact ? <span dir="auto">{String(label).replace(/\s*\([^)]*\)$/, "")}</span> : <SelectValue />}
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
