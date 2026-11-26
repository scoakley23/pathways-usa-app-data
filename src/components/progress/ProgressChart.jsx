import React, { useState, useEffect } from 'react';
import { lessonProgress as lessonProgressApi, lessonNotes as lessonNotesApi } from '@/api/lessons';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { COLORS } from '@/lib/theme';
import useProgressText from './useProgressText';

// Chart colors match the pw tokens (recharts needs raw values).
const NAVY = COLORS.navy;
const SECOND = COLORS.denim; // the second line (lessons): denim, dashed
const LINE = COLORS.line;
const MUTED = COLORS.muted;

export default function ProgressChart({ userEmail }) {
  const { t, locale } = useProgressText();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) loadChartData();
  }, [userEmail]);

  const loadChartData = async () => {
    try {
      const [lessonProgress, lessonNotes] = await Promise.all([
        lessonProgressApi.list({ sort: 'last_attempt_date', limit: 200 }),
        lessonNotesApi.list({ limit: 200 })
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
          <Loader2 className="w-6 h-6 animate-spin text-navy" aria-hidden="true" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="p-5 sm:p-6">
          <CardTitle className="flex items-center gap-3">
  <TrendingUp className="w-6 h-6 shrink-0" aria-hidden="true" />
            <span dir="auto">{t('chart')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
          <div className="text-center py-8 px-4 text-base text-muted bg-line-soft rounded-card" dir="auto">
            {t('chart_empty')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span dir="auto">{t('chart')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={LINE} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: '0.75rem', fill: MUTED }}
                tickLine={false}
                axisLine={{ stroke: LINE }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: '0.75rem', fill: MUTED }}
                tickLine={false}
                axisLine={{ stroke: LINE }}
                domain={[0, 100]}
                label={{ value: t('chart_score_axis'), angle: -90, position: 'insideLeft', style: { fontSize: '0.75rem', fill: NAVY, fontWeight: 700 } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: '0.75rem', fill: MUTED }}
                tickLine={false}
                axisLine={{ stroke: LINE }}
                allowDecimals={false}
                label={{ value: t('chart_lessons_axis'), angle: 90, position: 'insideRight', style: { fontSize: '0.75rem', fill: NAVY, fontWeight: 700 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${LINE}`,
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  color: NAVY
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.875rem', paddingTop: '12px', color: NAVY }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="quizScore"
                name={t('chart_score')}
                stroke={NAVY}
                strokeWidth={2.5}
                dot={{ r: 4, fill: NAVY, strokeWidth: 2, stroke: COLORS.white }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="lessonsCompleted"
                name={t('chart_lessons')}
                stroke={SECOND}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: SECOND, strokeWidth: 2, stroke: COLORS.white }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}