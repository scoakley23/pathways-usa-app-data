import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function LessonStatusCard({ lesson, progress }) {
  const isCompleted = progress?.completed && progress?.quiz_attempts > 0;
  const isInProgress = !isCompleted && progress != null;
  const bestScore = progress?.best_score || 0;

  const status = isCompleted ? 'completed' : isInProgress ? 'inProgress' : 'notStarted';

  const config = {
    completed: {
      icon: CheckCircle,
      color: 'text-pw-green-ink',
      bg: 'bg-pw-green-soft',
      border: 'border-transparent',
      label: 'Completed',
    },
    inProgress: {
      icon: Clock,
      color: 'text-pw-teal-ink',
      bg: 'bg-pw-teal-soft',
      border: 'border-transparent',
      label: 'In Progress',
    },
    notStarted: {
      icon: Circle,
      color: 'text-pw-muted',
      bg: 'bg-white',
      border: 'border-pw-line',
      label: 'Not Started',
    },
  }[status];

  const StatusIcon = config.icon;

  return (
    <Link to={createPageUrl('Lessons')} className="block h-full rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2">
      <Card
        className={`${config.border} ${config.bg} rounded-[14px] shadow-raised hover:shadow-lift transition-all cursor-pointer h-full`}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-pw-navy line-clamp-2 leading-snug">
              {lesson.title}
            </h4>
            <StatusIcon className={`w-5 h-5 ${config.color} shrink-0`} aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
            {isCompleted && bestScore > 0 && (
              <span className="text-sm font-bold text-pw-navy">{Math.round(bestScore)}%</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}