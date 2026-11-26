import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { COLORS } from '@/lib/theme';
import useProgressText from './useProgressText';

export default function PracticeCalendar({ history }) {
  const { t, date: fmt, time } = useProgressText();
  const [date, setDate] = React.useState(new Date());

  // Convert history to a set of dates for highlighting
  const practicedDates = history.reduce((acc, item) => {
    const dateStr = format(new Date(item.last_practiced), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  const modifiers = {
    practiced: Object.keys(practicedDates).map(d => new Date(d))
  };

  const modifiersStyles = {
    practiced: {
      backgroundColor: COLORS.navy,
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '100%'
    }
  };

  const selectedDayData = practicedDates[format(date || new Date(), 'yyyy-MM-dd')] || [];

  return (
    <Card>
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span dir="auto">{t('calendar')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0 flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 mx-auto md:mx-0">
           <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
             <div className="w-3 h-3 rounded-full bg-navy" aria-hidden="true" />
             <span className="text-small text-muted" dir="auto">{t('day_practiced')}</span>
           </div>
           <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="bg-white p-0 sm:p-3 sm:rounded-card sm:border sm:border-line"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-3 px-3 pb-3 sm:px-0 sm:pb-0">
            <h3 className="text-lg font-bold text-navy" dir="auto">
                {t('activity_for', { date: fmt(date || new Date(), { year: 'numeric', month: 'long', day: 'numeric' }) })}
            </h3>

            {selectedDayData.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pe-1">
                    {selectedDayData.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 rounded-card bg-white border border-line">
                            {item.status === 'mastered' ? (
                                <CheckCircle className="w-5 h-5 text-correct mt-0.5 shrink-0" aria-hidden="true" />
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-line mt-0.5 shrink-0" aria-hidden="true" />
                            )}
                            <div className="min-w-0">
                                <p className="font-semibold text-navy text-base" lang="en" dir="ltr">
                                    {item.sentence?.text || item.content?.text || item.content?.word || item.content?.question || t('practice_item')}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span dir="auto" className={`text-small font-semibold px-3 py-0.5 rounded-button ${
                                        item.status === 'mastered' ? 'bg-correct-bg text-correct' : 'bg-tint text-navy'
                                    }`}>
                                        {item.status === 'mastered' ? t('status_mastered') : t('status_practiced')}
                                    </span>
                                    <span className="text-small text-muted">
                                        {time(item.last_practiced)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-4 text-base text-muted bg-line-soft rounded-card">
                    <p dir="auto">{t('no_activity')}</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
