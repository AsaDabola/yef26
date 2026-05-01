import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Clock, Users, BookOpen, UserPlus, ChevronRight, Globe, MapPin, BarChart3, Target } from 'lucide-react-native';
import moment from 'moment';
import { useAuth } from '@/lib/auth';
import { Entities } from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import Badge, { pipelineColor } from '@/components/ui/Badge';

function StatsCard({ title, value, Icon, color }: {
  title: string; value: number;
  Icon: import('lucide-react-native').LucideIcon;
  color: string;
}) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-50', indigo: 'bg-indigo-50', green: 'bg-green-50', purple: 'bg-purple-50',
  };
  const ic: Record<string, string> = {
    blue: '#2563eb', indigo: '#4f46e5', green: '#16a34a', purple: '#9333ea',
  };
  return (
    <View className={`${bg[color]} rounded-2xl p-4 flex-1`}>
      <Icon size={20} color={ic[color]} />
      <Text className="text-2xl font-bold text-slate-800 mt-2">{value}</Text>
      <Text className="text-xs text-slate-500 mt-0.5">{title}</Text>
    </View>
  );
}

type Scope = 'chapter' | 'country' | 'global';
type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [scope, setScope] = useState<Scope>('chapter');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [refreshing, setRefreshing] = useState(false);

  const filter = scope === 'chapter' && user?.chapterId
    ? { chapterId: user.chapterId }
    : scope === 'country' && user?.country
      ? { country: user.country }
      : {};

  const { data: sessions = [], refetch: rSessions } = useQuery({
    queryKey: ['sessions', scope, user?.chapterId],
    queryFn: () => Entities.EvangelismSession.filter(filter, '-created_date', 200),
    enabled: !!user,
  });

  const { data: students = [], refetch: rStudents } = useQuery({
    queryKey: ['students', scope, user?.chapterId],
    queryFn: () => Entities.Student.filter(
      scope === 'chapter' && user?.chapterId
        ? { evangelizedByChapterId: user.chapterId }
        : scope === 'country' && user?.country
          ? { country: user.country }
          : {},
      '-created_date', 50),
    enabled: !!user,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([rSessions(), rStudents()]);
    setRefreshing(false);
  };

  const filterByTime = (data: Record<string, unknown>[]) => {
    if (timeRange === 'all') return data;
    const now = moment();
    const subtract: Record<TimeRange, [number, moment.unitOfTime.DurationConstructor]> = {
      week: [1, 'week'], month: [1, 'month'], quarter: [3, 'months'], year: [1, 'year'], all: [0, 'year'],
    };
    const [n, unit] = subtract[timeRange];
    const cutoff = now.clone().subtract(n, unit);
    return data.filter((item) => moment(item.created_date as string).isAfter(cutoff));
  };

  const filtered = filterByTime(sessions as Record<string, unknown>[]);
  const filteredStudents = filterByTime(students as Record<string, unknown>[]);
  const totalHours = Math.round(filtered.reduce((s, x) => s + ((x.durationMinutes as number) || 0), 0) / 60);
  const bibleStudies = filteredStudents.filter((s) =>
    ['Bible Study Started', 'Bible Study In Progress'].includes(s.statusPipeline as string)
  ).length;

  const scopeLabels: Record<Scope, string> = { chapter: 'Local', country: 'Country', global: 'Global' };
  const timeLabels: Record<TimeRange, string> = {
    week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year', all: 'All',
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-4 pt-12 pb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-slate-800">Dashboard</Text>
            <Text className="text-sm text-slate-500 mt-0.5">
              {user?.chapterName || 'YEF'} · {scopeLabels[scope]}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white font-bold text-xs">YEF</Text>
          </View>
        </View>

        {/* Scope Tabs */}
        <View className="flex-row bg-slate-100 rounded-xl p-1 mb-3">
          {(['chapter', 'country', 'global'] as Scope[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setScope(s)}
              className={`flex-1 py-1.5 rounded-lg items-center ${scope === s ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-medium ${scope === s ? 'text-slate-800' : 'text-slate-500'}`}>
                {s === 'chapter' ? '📍 Local' : s === 'country' ? '🌍 Country' : '🌐 Global'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Time Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          <View className="flex-row gap-2">
            {(['week', 'month', 'quarter', 'year', 'all'] as TimeRange[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-full border ${timeRange === t ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white'}`}
              >
                <Text className={`text-xs font-medium ${timeRange === t ? 'text-white' : 'text-slate-600'}`}>
                  {timeLabels[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-5">
          <TouchableOpacity onPress={() => router.push('/analytics')}
            className="flex-1 border border-slate-200 bg-white rounded-xl py-3 flex-row items-center justify-center gap-2">
            <BarChart3 size={16} color="#64748b" />
            <Text className="text-sm font-medium text-slate-700">Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/goals')}
            className="flex-1 border border-slate-200 bg-white rounded-xl py-3 flex-row items-center justify-center gap-2">
            <Target size={16} color="#64748b" />
            <Text className="text-sm font-medium text-slate-700">Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-5">
          <StatsCard title="Hours" value={totalHours} Icon={Clock} color="blue" />
          <StatsCard title="Sessions" value={filtered.length} Icon={Users} color="indigo" />
        </View>
        <View className="flex-row gap-3 mb-5">
          <StatsCard title="Students" value={filteredStudents.length} Icon={UserPlus} color="green" />
          <StatsCard title="Bible Studies" value={bibleStudies} Icon={BookOpen} color="purple" />
        </View>

        {/* Recent Students */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-slate-800">Recent Students</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/students')} className="flex-row items-center gap-1">
            <Text className="text-sm text-blue-600">View All</Text>
            <ChevronRight size={14} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {students.length === 0 ? (
          <Card className="items-center py-8">
            <UserPlus size={40} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3 text-sm">No students yet</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/add')} className="mt-2">
              <Text className="text-blue-600 text-sm">Start Evangelizing</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <View className="gap-3">
            {(students as Record<string, unknown>[]).slice(0, 8).map((student) => (
              <TouchableOpacity
                key={student.id as string}
                onPress={() => router.push(`/student/${student.id}`)}
              >
                <Card className="p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                      <Text className="text-blue-700 font-semibold text-sm">
                        {(student.name as string)?.charAt(0)?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-slate-800">{student.name as string}</Text>
                      <Text className="text-xs text-slate-500">{student.universityName as string}</Text>
                    </View>
                    <Badge variant={pipelineColor(student.statusPipeline as string)}>
                      {(student.statusPipeline as string)?.split(' ')[0]}
                    </Badge>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
