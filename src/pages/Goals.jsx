import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Plus, Target, Clock, Users, BookOpen, Calendar,
  Loader2, Trash2, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';

const GOAL_TYPES = [
  { value: 'hours', label: 'Evangelism Hours', icon: Clock, color: 'blue' },
  { value: 'students', label: 'New Contacts', icon: Users, color: 'green' },
  { value: 'bible_studies', label: 'Bible Studies', icon: BookOpen, color: 'purple' },
  { value: 'sessions', label: 'Sessions', icon: Calendar, color: 'indigo' }
];

export default function Goals() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('personal');
  const [form, setForm] = useState({
    title: '',
    type: 'hours',
    targetValue: 10,
    scope: 'personal',
    startDate: moment().format('YYYY-MM-DD'),
    endDate: moment().add(1, 'month').format('YYYY-MM-DD')
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.userRole === 'Admin' || user?.userRole === 'Evangelism Leader';

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id, user?.chapterId],
    queryFn: () => base44.entities.Goal.list('-created_date', 100),
    enabled: !!user
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['userSessions', user?.id],
    queryFn: () => base44.entities.EvangelismSession.list('-created_date', 500),
    enabled: !!user
  });

  const { data: students = [] } = useQuery({
    queryKey: ['userStudents', user?.id],
    queryFn: () => base44.entities.Student.list('-created_date', 500),
    enabled: !!user
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setShowForm(false);
      setForm({
        title: '',
        type: 'hours',
        targetValue: 10,
        scope: 'personal',
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().add(1, 'month').format('YYYY-MM-DD')
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['goals'])
  });

  const handleCreate = () => {
    createGoalMutation.mutate({
      ...form,
      userId: form.scope === 'personal' ? user?.id : null,
      userName: form.scope === 'personal' ? user?.full_name : null,
      chapterId: user?.chapterId,
      chapterName: user?.chapterName
    });
  };

  const calculateProgress = (goal) => {
    const start = moment(goal.startDate);
    const end = moment(goal.endDate);
    
    let relevantSessions = sessions.filter(s => {
      const date = moment(s.created_date);
      return date.isBetween(start, end, null, '[]');
    });
    
    let relevantStudents = students.filter(s => {
      const date = moment(s.created_date);
      return date.isBetween(start, end, null, '[]');
    });

    if (goal.scope === 'personal') {
      relevantSessions = relevantSessions.filter(s => s.userId === goal.userId);
      relevantStudents = relevantStudents.filter(s => s.evangelizedByUserId === goal.userId);
    } else if (goal.scope === 'chapter') {
      relevantSessions = relevantSessions.filter(s => s.chapterId === goal.chapterId);
      relevantStudents = relevantStudents.filter(s => s.evangelizedByChapterId === goal.chapterId);
    }

    switch (goal.type) {
      case 'hours':
        return Math.round(relevantSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60);
      case 'students':
        return relevantStudents.length;
      case 'bible_studies':
        return relevantStudents.filter(s => 
          ['Bible Study Started', 'Bible Study In Progress'].includes(s.statusPipeline)
        ).length;
      case 'sessions':
        return relevantSessions.length;
      default:
        return 0;
    }
  };

  const myGoals = goals.filter(g => g.scope === 'personal' && g.userId === user?.id);
  const chapterGoals = goals.filter(g => g.scope === 'chapter' && g.chapterId === user?.chapterId);
  const displayedGoals = tab === 'personal' ? myGoals : chapterGoals;

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">Goals</h1>
          <p className="text-sm text-slate-500">Track your progress</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          New Goal
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Create New Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Goal Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="e.g., Reach 20 hours this month"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target</Label>
                <Input
                  type="number"
                  value={form.targetValue}
                  onChange={(e) => setForm({...form, targetValue: parseInt(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({...form, startDate: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({...form, endDate: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            {isAdmin && (
              <div>
                <Label>Scope</Label>
                <Select value={form.scope} onValueChange={(v) => setForm({...form, scope: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Goal</SelectItem>
                    <SelectItem value="chapter">Chapter Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button 
              onClick={handleCreate} 
              disabled={!form.title || createGoalMutation.isPending}
              className="w-full"
            >
              {createGoalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Goal'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="personal" className="flex-1">My Goals</TabsTrigger>
          <TabsTrigger value="chapter" className="flex-1">Chapter Goals</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayedGoals.length > 0 ? (
        <div className="space-y-4">
          {displayedGoals.map(goal => {
            const current = calculateProgress(goal);
            const percentage = Math.min((current / goal.targetValue) * 100, 100);
            const goalType = GOAL_TYPES.find(t => t.value === goal.type);
            const Icon = goalType?.icon || Target;
            const isComplete = current >= goal.targetValue;
            const isExpired = moment().isAfter(goal.endDate);

            return (
              <Card key={goal.id} className={isComplete ? 'border-green-200 bg-green-50/50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${goalType?.color || 'blue'}-100 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${goalType?.color || 'blue'}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{goal.title}</h3>
                        <p className="text-xs text-slate-500">
                          {moment(goal.startDate).format('MMM D')} - {moment(goal.endDate).format('MMM D, YYYY')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isComplete && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                      {isExpired && !isComplete && (
                        <Badge variant="secondary" className="text-slate-500">Expired</Badge>
                      )}
                      {(goal.userId === user?.id || isAdmin) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold">{current} / {goal.targetValue}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-slate-400 text-right">{Math.round(percentage)}%</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No {tab} goals yet</p>
          <Button onClick={() => setShowForm(true)} variant="link" className="mt-2">
            Create your first goal
          </Button>
        </div>
      )}
    </div>
  );
}