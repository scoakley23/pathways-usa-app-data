import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import useProgressText from './useProgressText';

// The learner's target date lives only on this device. It is never sent to
// Base44 or the AI.
export const TARGET_DATE_KEY = 'pathways_target_date';

function loadDate() {
  try {
    const raw = localStorage.getItem(TARGET_DATE_KEY);
    return raw ? parseISO(raw) : null;
  } catch (e) {
    return null;
  }
}

export default function TestDateTracker() {
  const { t, date: fmt } = useProgressText();
  const [date, setDate] = useState(loadDate);

  const handleSelect = (newDate) => {
    setDate(newDate || null);
    try {
      if (newDate) {
        localStorage.setItem(TARGET_DATE_KEY, format(newDate, 'yyyy-MM-dd'));
      } else {
        localStorage.removeItem(TARGET_DATE_KEY);
      }
    } catch (e) {
      // Storage blocked (private mode, etc.): the date works for this visit only.
    }
  };

  const daysLeft = date ? differenceInDays(date, new Date()) : null;

  return (
    <div className="rounded-card bg-white border-[1.5px] border-line p-4 space-y-3 text-navy">
      <h2 className="text-lg font-bold" dir="auto">{t('date_title')}</h2>
      <div className="flex flex-wrap items-center gap-3">
        {date && (
          <p className="flex-1 min-w-[120px] font-display text-[1.75rem] leading-none" dir="auto">
            {daysLeft > 1 ? t('date_left', { n: daysLeft }) : daysLeft === 1 ? t('date_left_one') : daysLeft === 0 ? t('date_today') : t('date_passed')}
          </p>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "w-full sm:w-auto flex-1 min-h-tap rounded-button border-[1.5px] border-line bg-white px-4 inline-flex items-center gap-2 text-start text-base font-semibold text-navy hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim",
                !date && "text-muted"
              )}
            >
              <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {date ? fmt(date, { year: 'numeric', month: 'long', day: 'numeric' }) : <span dir="auto">{t('date_set')}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-small text-muted" dir="auto">{t('date_note')}</p>
    </div>
  );
}
