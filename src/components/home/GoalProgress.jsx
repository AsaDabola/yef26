import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, Users, BookOpen, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const GOAL_ICONS = {
  hours: Clock,
  students: Users,
  bible_studies: BookOpen,
  sessions: Calendar
};

export default function GoalProgress({ goals, sessions, students }) {
  if (!goals || goals.length === 0) return null;

  const calculateProgress = (goal) => {
    switch (goal.type) {
      case 'hours':
        return Math.round(sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60);
      case 'students':
        return students.length;
      case 'bible_studies':
        return students.filter(s => 
          ['Bible Study Started', 'Bible Study In Progress'].includes(s.statusPipeline)
        ).length;
      case 'sessions':
        return sessions.length;
      default:
        return 0;
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 2);

  if (activeGoals.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm text-slate-800">Active Goals</span>
          </div>
          <Link to={createPageUrl('Goals')} className="text-xs text-blue-600">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {activeGoals.map(goal => {
            const current = calculateProgress(goal);
            const percentage = Math.min((current / goal.targetValue) * 100, 100);
            const Icon = GOAL_ICONS[goal.type] || Target;
            
            return (
              <div key={goal.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 truncate max-w-[150px]">{goal.title}</span>
                  </div>
                  <span className="font-medium">{current}/{goal.targetValue}</span>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}