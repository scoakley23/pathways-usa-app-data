import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

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
    <div className="rounded-3xl bg-white border border-pw-line p-4 space-y-3 sm:min-w-[280px]">
      <div className="flex flex-wrap items-center gap-3">
        {date && (
          <div className="flex-1 min-w-[120px]">
            <p className="text-xs text-pw-muted font-bold uppercase tracking-widest">Time Remaining</p>
            <p className={`text-2xl font-extrabold ${daysLeft < 30 ? 'text-pw-red-ink' : 'text-pw-navy'}`}>
              {daysLeft > 0 ? `${daysLeft} Days` : daysLeft === 0 ? 'Today!' : 'Passed'}
            </p>
          </div>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full sm:w-auto flex-1 justify-start text-left font-semibold",
                !date && "text-pw-muted"
              )}
            >
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              {date ? format(date, "PPP") : <span>Set Test Date</span>}
            </Button>
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
      <p className="text-sm text-pw-muted">Your date stays on this phone. We don't save it.</p>
    </div>
  );
}
