import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BarChart2, Target, Clock, Users, BookOpen, TrendingUp } from 'lucide-react-native';
import moment from 'moment';
import { useAuth } from '../../lib/auth';
import { Entities } from '../../lib/firestore';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge, pipelineColor } from '../../components/ui/Badge';
import type { EvangelismSession, Student } from '../../lib/types';

type Scope = 'Local' | 'Country' | 'Global';
type TimeRange = 'Week' | 'Month' | 'Quarter' | 'Year' | 'All';

function sinceDate(range: TimeRange): Date {
  const d = new Date();
  if (range === 'Week') d.setDate(d.getDate() - 7);
  else if (range === 'Month') d.setMonth(d.getMonth() - 1);
  else if (range === 'Quarter') d.setMonth(d.getMonth() - 3);
  else if (range === 'Year') d.setFullYear(d.getFullYear() - 1);
  else d.setFullYear(2000);
  return d;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>('Local');
  const [timeRange, setTimeRange] = useState<TimeRange>('Month');

  const { data: sessions = [], refetch: rSessions, isFetching: fSessions } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions-all'],
    queryFn: () => Entities.EvangelismSession.list('-created_date', 500) as Promise<EvangelismSession[]>,
  });

  const { data: students = [], refetch: rStudents, isFetching: fStudents } = useQuery<Student[]>({
    queryKey: ['students-all'],
    queryFn: () => Entities.Student.list('-created_date', 500) as Promise<Student[]>,
  });

  const since = sinceDate(timeRange);

  function matchesScope(item: { chapterId?: string; country?: string; userId?: string; evangelizedByUserId?: string }) {
    if (scope === 'Local') {
      const uid = (item as any).userId ?? (item as any).evangelizedByUserId;
      const chId = (item as any).chapterId ?? (item as any).evangelizedByChapterId;
      return uid === user?.id || chId === user?.chapterId;
    }
    if (scope === 'Country') {
      return (item as any).country === user?.country;
    }
    return true;
  }

  const filteredSessions = sessions.filter(
    (s) => new Date(s.created_date) >= since && matchesScope(s)
  );
  const filteredStudents = students.filter(
    (s) => new Date(s.created_date) >= since && matchesScope(s)
  );

  const totalHours = Math.round(
    filteredSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0) / 60 * 10
  ) / 10;
  const totalBibleStudies = filteredStudents.filter(
    (s) => s.bibleStudyTopics?.some((t) => t.completed)
  ).length;

  const stats = [
    { label: 'Hours', value: totalHours, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sessions', value: filteredSessions.length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Students', value: filteredStudents.length, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Bible Studies', value: totalBibleStudies, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const recentStudents = students.slice(0, 5);
  const isRefreshing = fSessions || fStudents;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => { rSessions(); rStudents(); }}
        />
      }
    >
      {/* Header */}
      <View className="bg-blue-600 pt-14 pb-6 px-5">
        <Text className="text-white text-sm opacity-80">Welcome back,</Text>
        <Text className="text-white text-xl font-bold mt-0.5">
          {user?.full_name ?? user?.name ?? 'Friend'}
        </Text>
        <Text className="text-blue-200 text-xs mt-0.5">{user?.chapterName}</Text>

        {/* Scope filter */}
        <View className="flex-row gap-2 mt-4">
          {(['Local', 'Country', 'Global'] as Scope[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setScope(s)}
              className={`px-3 py-1.5 rounded-full ${scope === s ? 'bg-white' : 'bg-blue-500'}`}
            >
              <Text className={`text-xs font-semibold ${scope === s ? 'text-blue-700' : 'text-white'}`}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="px-4 -mt-3">
        {/* Time range */}
        <Card className="mb-4">
          <CardContent className="pt-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {(['Week', 'Month', 'Quarter', 'Year', 'All'] as TimeRange[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setTimeRange(r)}
                    className={`px-3 py-1.5 rounded-full ${timeRange === r ? 'bg-blue-600' : 'bg-slate-100'}`}
                  >
                    <Text className={`text-xs font-semibold ${timeRange === r ? 'text-white' : 'text-slate-600'}`}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-3 mb-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="flex-1 min-w-[44%]">
              <CardContent className="pt-3">
                <View className={`w-9 h-9 rounded-xl ${bg} items-center justify-center mb-2`}>
                  <Icon size={18} color={color.replace('text-', '').replace('-600', '')} />
                </View>
                <Text className="text-2xl font-bold text-slate-800">{value}</Text>
                <Text className="text-xs text-slate-500 mt-0.5">{label}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Quick actions */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center gap-3"
            onPress={() => router.push('/analytics')}
          >
            <View className="w-9 h-9 bg-indigo-50 rounded-xl items-center justify-center">
              <BarChart2 size={18} color="#4f46e5" />
            </View>
            <Text className="text-sm font-semibold text-slate-700">Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center gap-3"
            onPress={() => router.push('/goals')}
          >
            <View className="w-9 h-9 bg-green-50 rounded-xl items-center justify-center">
              <Target size={18} color="#16a34a" />
            </View>
            <Text className="text-sm font-semibold text-slate-700">Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Recent students */}
        {recentStudents.length > 0 && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-slate-800 mb-3">Recent Students</Text>
            <View className="gap-2">
              {recentStudents.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => router.push(`/student/${s.id}` as any)}
                >
                  <Card>
                    <CardContent className="pt-3 flex-row items-center justify-between">
                      <View>
                        <Text className="text-sm font-semibold text-slate-800">{s.name}</Text>
                        <Text className="text-xs text-slate-500">{s.universityName}</Text>
                        <Text className="text-xs text-slate-400 mt-0.5">
                          {moment(s.created_date).fromNow()}
                        </Text>
                      </View>
                      <Badge variant={pipelineColor(s.statusPipeline)}>
                        {s.statusPipeline}
                      </Badge>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
