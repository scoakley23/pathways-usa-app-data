import { Globe, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

export default function LanguageSelector({ language, onLanguageChange, translating }) {
  return (
    <Select value={language} onValueChange={onLanguageChange} disabled={translating}>
      <SelectTrigger className="w-[160px] min-h-[44px] bg-white" aria-label="Lesson language">
        {translating ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2 text-pw-navy" />
        ) : (
          <Globe className="w-4 h-4 mr-2 text-pw-muted" />
        )}
        <SelectValue />
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