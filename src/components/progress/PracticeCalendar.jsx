import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PracticeCalendar({ history }) {
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
      backgroundColor: '#14264A', // pw-navy
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '100%'
    }
  };

  const selectedDayData = practicedDates[format(date || new Date(), 'yyyy-MM-dd')] || [];

  return (
    <Card>
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="w-10 h-10 rounded-2xl bg-pw-blue-soft text-pw-blue-ink grid place-items-center shrink-0">
            <CalendarIcon className="w-5 h-5" aria-hidden="true" />
          </span>
          Practice Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0 flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 mx-auto md:mx-0">
           <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
             <div className="w-3 h-3 rounded-full bg-pw-navy" aria-hidden="true" />
             <span className="text-sm text-pw-muted">Day Practiced</span>
           </div>
           <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-2xl border border-pw-line bg-white p-2 sm:p-3"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
            <h4 className="text-lg font-extrabold text-pw-navy">
                Activity for {date ? format(date, 'MMMM do, yyyy') : 'Selected Date'}
            </h4>

            {selectedDayData.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {selectedDayData.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-pw-line">
                            {item.status === 'mastered' ? (
                                <CheckCircle className="w-5 h-5 text-pw-green-ink mt-0.5 shrink-0" aria-hidden="true" />
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-pw-line mt-0.5 shrink-0" aria-hidden="true" />
                            )}
                            <div className="min-w-0">
                                <p className="font-semibold text-pw-navy text-base">
                                    {item.sentence?.text || item.content?.text || item.content?.word || item.content?.question || "Practice Session"}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${
                                        item.status === 'mastered' ? 'bg-pw-green-soft text-pw-green-ink' : 'bg-pw-soft text-pw-navy'
                                    }`}>
                                        {item.status === 'mastered' ? 'Mastered' : 'Practiced'}
                                    </span>
                                    <span className="text-sm text-pw-muted">
                                        {format(new Date(item.last_practiced), 'h:mm a')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-4 text-base text-pw-muted bg-pw-soft rounded-2xl">
                    <p>No activity recorded for this day.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
