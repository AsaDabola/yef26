import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Clock, Users, BookOpen, UserPlus, ChevronRight, Globe, MapPin, BarChart3, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatsCard from '@/components/home/StatsCard';
import StudentCard from '@/components/home/StudentCard';
import Leaderboard from '@/components/home/Leaderboard';
import GoalProgress from '@/components/home/GoalProgress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

export default function Home() {
  const [user, setUser] = useState(null);
  const [scope, setScope] = useState('chapter');
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions', scope, timeRange, user?.chapterId],
    queryFn: async () => {
      let filter = {};
      if (scope === 'chapter' && user?.chapterId) {
        filter.chapterId = user.chapterId;
      } else if (scope === 'country' && user?.country) {
        filter.country = user.country;
      }
      return base44.entities.EvangelismSession.filter(filter, '-created_date', 100);
    },
    enabled: !!user
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students', scope, user?.chapterId],
    queryFn: async () => {
      let filter = {};
      if (scope === 'chapter' && user?.chapterId) {
        filter.evangelizedByChapterId = user.chapterId;
      } else if (scope === 'country' && user?.country) {
        filter.country = user.country;
      }
      return base44.entities.Student.filter(filter, '-created_date', 50);
    },
    enabled: !!user
  });

  // Note: User entity has special security - only admins can see all users
  // For leaderboards, we use session/student data which is accessible to all
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', scope, user?.chapterId],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  // Fetch user's goals
  const { data: goals = [] } = useQuery({
    queryKey: ['myGoals', user?.id],
    queryFn: () => base44.entities.Goal.filter({ userId: user?.id, status: 'active' }, '-created_date', 10),
    enabled: !!user
  });

  // Fetch ALL sessions and students for global leaderboard
  const { data: allSessions = [] } = useQuery({
    queryKey: ['allSessionsGlobal'],
    queryFn: () => base44.entities.EvangelismSession.list('-created_date', 1000),
    enabled: !!user
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ['allStudentsGlobal'],
    queryFn: () => base44.entities.Student.list('-created_date', 1000),
    enabled: !!user
  });

  // Calculate stats
  const getTimeFilteredData = (data, dateField = 'created_date') => {
    if (timeRange === 'all') return data;
    const now = moment();
    return data.filter(item => {
      const itemDate = moment(item[dateField]);
      switch (timeRange) {
        case 'week': return itemDate.isAfter(now.clone().subtract(1, 'week'));
        case 'month': return itemDate.isAfter(now.clone().subtract(1, 'month'));
        case 'quarter': return itemDate.isAfter(now.clone().subtract(3, 'months'));
        case 'year': return itemDate.isAfter(now.clone().subtract(1, 'year'));
        default: return true;
      }
    });
  };

  const filteredSessions = getTimeFilteredData(sessions);
  const filteredStudents = getTimeFilteredData(students);

  const totalHours = Math.round(filteredSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60);
  const totalSessions = filteredSessions.length;
  const totalStudents = filteredStudents.length;
  const bibleStudies = filteredStudents.filter(s => 
    ['Bible Study Started', 'Bible Study In Progress'].includes(s.statusPipeline)
  ).length;

  // Calculate GLOBAL leaderboards (always from all data, filtered by time)
  const globalFilteredSessions = getTimeFilteredData(allSessions);
  const globalFilteredStudents = getTimeFilteredData(allStudents);

  const globalUserStats = allUsers.map(u => {
    const userSessions = globalFilteredSessions.filter(s => s.userId === u.id);
    const userStudents = globalFilteredStudents.filter(s => s.evangelizedByUserId === u.id);
    return {
      id: u.id,
      name: u.full_name,
      profilePhoto: u.profilePhoto,
      chapterName: u.chapterName,
      hours: Math.round(userSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60),
      students: userStudents.length
    };
  });

  const hoursLeaderboard = globalUserStats
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)
    .map(u => ({ ...u, value: u.hours }));

  const studentsLeaderboard = globalUserStats
    .sort((a, b) => b.students - a.students)
    .slice(0, 5)
    .map(u => ({ ...u, value: u.students }));

  const recentStudents = students.slice(0, 10);

  const isLoading = loadingSessions || loadingStudents;

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.chapterName || 'YEF'} • {scope === 'global' ? 'Global' : scope === 'country' ? user?.country : 'Local'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">YEF</span>
        </div>
      </div>

      {/* Scope & Time Filters */}
      <div className="flex gap-2 mb-6">
        <Tabs value={scope} onValueChange={setScope} className="flex-1">
          <TabsList className="w-full grid grid-cols-3 bg-slate-100">
            <TabsTrigger value="chapter" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              Local
            </TabsTrigger>
            <TabsTrigger value="country" className="text-xs">
              Country
            </TabsTrigger>
            <TabsTrigger value="global" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              Global
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-28 bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link to={createPageUrl('Analytics')}>
          <Button variant="outline" className="w-full">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </Link>
        <Link to={createPageUrl('Goals')}>
          <Button variant="outline" className="w-full">
            <Target className="w-4 h-4 mr-2" />
            Goals
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatsCard 
            title="Hours" 
            value={totalHours} 
            icon={Clock} 
            color="blue"
          />
          <StatsCard 
            title="Sessions" 
            value={totalSessions} 
            icon={Users} 
            color="indigo"
          />
          <StatsCard 
            title="Students" 
            value={totalStudents} 
            icon={UserPlus} 
            color="green"
          />
          <StatsCard 
            title="Bible Studies" 
            value={bibleStudies} 
            icon={BookOpen} 
            color="purple"
          />
        </div>
      )}

      {/* Goal Progress */}
      <GoalProgress goals={goals} sessions={filteredSessions} students={filteredStudents} />

      {/* Global Leaderboards Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">🏆 Global Leaderboards</h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {timeRange === 'all' ? 'All Time' : timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : timeRange === 'quarter' ? 'Quarter' : 'This Year'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Leaderboard data={hoursLeaderboard} type="hours" />
          <Leaderboard data={studentsLeaderboard} type="students" />
        </div>
      </div>

      {/* View All Members */}
      <Link to={createPageUrl('Members')}>
        <Button variant="outline" className="w-full mb-4">
          <Users className="w-4 h-4 mr-2" />
          View All Members
        </Button>
      </Link>

      {/* Recent Students Feed */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Recent Students</h2>
          <Link 
            to={createPageUrl('Students')}
            className="text-sm text-blue-600 flex items-center gap-1 hover:underline"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {loadingStudents ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : recentStudents.length > 0 ? (
          <div className="space-y-3">
            {recentStudents.map(student => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
            <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No students yet</p>
            <Link 
              to={createPageUrl('Add')}
              className="text-sm text-blue-600 mt-2 inline-block hover:underline"
            >
              Start Evangelizing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}