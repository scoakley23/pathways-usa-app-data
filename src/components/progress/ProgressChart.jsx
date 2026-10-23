import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Chart colors match the pw tokens (recharts needs raw values).
const NAVY = '#14264A';
const RED = '#B53A32'; // Red ink (Signal red is for the dot only)
const LINE = '#DEE4EE';
const MUTED = '#3D4F73'; // pw-muted

export default function ProgressChart({ userEmail }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) loadChartData();
  }, [userEmail]);

  const loadChartData = async () => {
    try {
      const [lessonProgress, lessonNotes] = await Promise.all([
        base44.entities.LessonProgress.filter({ user_email: userEmail }, 'last_attempt_date', 200),
        base44.entities.LessonNotes.filter({ user_email: userEmail.toLowerCase().trim() }, null, 200)
      ]);

      // Build a map of dates to aggregate data
      const dateMap = {};

      // Add quiz scores by date
      lessonProgress.forEach((lp) => {
        if (!lp.last_attempt_date) return;
        const date = new Date(lp.last_attempt_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        if (!dateMap[date]) {
          dateMap[date] = { date, quizScore: 0, quizCount: 0, lessonsCompleted: 0 };
        }
        if (lp.last_score !== undefined && lp.last_score !== null) {
          dateMap[date].quizScore += lp.last_score;
          dateMap[date].quizCount += 1;
        }
        if (lp.completed) {
          dateMap[date].lessonsCompleted += 1;
        }
      });

      // Add lessons completed via notes (each note saved = a lesson interaction)
      lessonNotes.forEach((note) => {
        const date = new Date(note.created_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        if (!dateMap[date]) {
          dateMap[date] = { date, quizScore: 0, quizCount: 0, lessonsCompleted: 0 };
        }
        dateMap[date].lessonsCompleted += 1;
      });

      // Convert to array, calculate averages, and sort by date
      const data = Object.values(dateMap)
        .map((d) => ({
          date: d.date,
          quizScore: d.quizCount > 0 ? Math.round(d.quizScore / d.quizCount) : 0,
          lessonsCompleted: d.lessonsCompleted
        }))
        .sort((a, b) => {
          // Sort by parsed date
          const parse = (s) => new Date(s + ', ' + new Date().getFullYear());
          return parse(a.date) - parse(b.date);
        });

      // Limit to last 30 data points for readability
      setChartData(data.slice(-30));
    } catch (err) {
      console.error('Failed to load chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-pw-navy" aria-hidden="true" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="p-5 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <span className="w-10 h-10 rounded-2xl bg-pw-blue-soft text-pw-blue-ink grid place-items-center shrink-0">
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
            </span>
            Improvement Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
          <div className="text-center py-8 px-4 text-base text-pw-muted bg-pw-soft rounded-2xl">
            Complete lessons and take quizzes to see your progress over time.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="w-10 h-10 rounded-2xl bg-pw-blue-soft text-pw-blue-ink grid place-items-center shrink-0">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
          </span>
          Improvement Over Time
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={LINE} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: MUTED }}
                tickLine={false}
                axisLine={{ stroke: LINE }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: MUTED }}
                tickLine={false}
                axisLine={{ stroke: LINE }}
                domain={[0, 100]}
                label={{ value: 'Quiz Score %', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: NAVY, fontWeight: 700 } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: MUTED }}
                tickLine={false}
                axisLine={{ stroke: LINE }}
                allowDecimals={false}
                label={{ value: 'Lessons', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: NAVY, fontWeight: 700 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: `1px solid ${LINE}`,
                  borderRadius: '16px',
                  fontSize: '14px',
                  color: NAVY
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '14px', paddingTop: '12px', color: NAVY }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="quizScore"
                name="Avg Quiz Score"
                stroke={NAVY}
                strokeWidth={2.5}
                dot={{ r: 4, fill: NAVY, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="lessonsCompleted"
                name="Lessons Completed"
                stroke={RED}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: RED, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}