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
      color: 'text-correct',
      bg: 'bg-correct-bg',
      border: 'border-transparent',
      label: 'Completed',
    },
    inProgress: {
      icon: Clock,
      color: 'text-navy',
      bg: 'bg-tint',
      border: 'border-transparent',
      label: 'In Progress',
    },
    notStarted: {
      icon: Circle,
      color: 'text-muted',
      bg: 'bg-white',
      border: 'border-line',
      label: 'Not Started',
    },
  }[status];

  const StatusIcon = config.icon;

  return (
    <Link to={createPageUrl('Lessons')} className="block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
      <Card
        className={`${config.border} ${config.bg} rounded-card shadow-raised hover:shadow-lift transition-all cursor-pointer h-full`}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-navy line-clamp-2 leading-snug">
              {lesson.title}
            </h4>
            <StatusIcon className={`w-5 h-5 ${config.color} shrink-0`} aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
            {isCompleted && bestScore > 0 && (
              <span className="text-sm font-bold text-navy">{Math.round(bestScore)}%</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}