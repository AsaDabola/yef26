import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, BookOpen, Clock, Target, TrendingUp, Users } from 'lucide-react-native';
import moment from 'moment';
import { useAuth } from '../../lib/auth';
import { SessionDB, StudentDB } from '../../lib/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge, pipelineBadgeColor } from '../../components/ui/Badge';
import type { EvangelismSession, Student } from '../../lib/types';

type Scope = 'Local' | 'Country' | 'Global';
type Range = 'Week' | 'Month' | 'Quarter' | 'Year' | 'All';

function sinceDate(r: Range): Date {
  const d = new Date();
  if (r === 'Week') d.setDate(d.getDate() - 7);
  else if (r === 'Month') d.setMonth(d.getMonth() - 1);
  else if (r === 'Quarter') d.setMonth(d.getMonth() - 3);
  else if (r === 'Year') d.setFullYear(d.getFullYear() - 1);
  else d.setFullYear(2000);
  return d;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>('Local');
  const [range, setRange] = useState<Range>('Month');

  const { data: sessions = [], refetch: rS, isFetching: fS } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionDB.list('-created_date', 500) as Promise<EvangelismSession[]>,
  });
  const { data: students = [], refetch: rSt, isFetching: fSt } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => StudentDB.list('-created_date', 500) as Promise<Student[]>,
  });

  const since = sinceDate(range);

  function inScope(s: EvangelismSession | Student) {
    if (scope === 'Local') {
      const uid = 'userId' in s ? s.userId : s.evangelizedByUserId;
      const cid = 'chapterId' in s ? s.chapterId : s.evangelizedByChapterId;
      return uid === user?.id || cid === user?.chapterId;
    }
    if (scope === 'Country') return s.country === user?.country;
    return true;
  }

  const filtSessions = sessions.filter((s) => new Date(s.created_date) >= since && inScope(s));
  const filtStudents = students.filter((s) => new Date(s.created_date) >= since && inScope(s));

  const hours = Math.round(
    filtSessions.reduce((a, s) => a + (s.durationMinutes || 0), 0) / 60 * 10,
  ) / 10;
  const bibleStudies = filtStudents.filter(
    (s) => s.bibleStudyTopics?.some((t) => t.completed),
  ).length;

  const stats = [
    { label: 'Hours',        value: hours,                 icon: Clock },
    { label: 'Sessions',     value: filtSessions.length,  icon: TrendingUp },
    { label: 'Students',     value: filtStudents.length,  icon: Users },
    { label: 'Bible Studies',value: bibleStudies,         icon: BookOpen },
  ];

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl refreshing={fS || fSt} onRefresh={() => { rS(); rSt(); }} />
      }
    >
      {/* Hero header */}
      <View className="bg-blue-600 px-5 pb-6 pt-14">
        <Text className="text-sm text-blue-200">Welcome back,</Text>
        <Text className="text-xl font-bold text-white">{user?.full_name ?? user?.name ?? 'Friend'}</Text>
        <Text className="text-xs text-blue-200 mt-0.5">{user?.chapterName}</Text>

        <View className="mt-4 flex-row gap-2">
          {(['Local', 'Country', 'Global'] as Scope[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setScope(s)}
              className={`rounded-full px-3 py-1.5 ${scope === s ? 'bg-white' : 'bg-blue-500'}`}
            >
              <Text className={`text-xs font-semibold ${scope === s ? 'text-blue-700' : 'text-white'}`}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="px-4 pt-3">
        {/* Range chips */}
        <Card className="mb-4">
          <CardContent className="flex-row gap-2 pt-3">
            {(['Week', 'Month', 'Quarter', 'Year', 'All'] as Range[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                className={`rounded-full px-3 py-1.5 ${range === r ? 'bg-blue-600' : 'bg-slate-100'}`}
              >
                <Text className={`text-xs font-semibold ${range === r ? 'text-white' : 'text-slate-600'}`}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Stats grid */}
        <View className="mb-4 flex-row flex-wrap gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="min-w-[44%] flex-1">
              <CardContent className="pt-3">
                <Icon size={20} color="#2563eb" />
                <Text className="mt-2 text-2xl font-bold text-slate-800">{value}</Text>
                <Text className="text-xs text-slate-500">{label}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Quick actions */}
        <View className="mb-4 flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push('/analytics')}
            className="flex-1 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <BarChart2 size={18} color="#4f46e5" />
            </View>
            <Text className="text-sm font-semibold text-slate-700">Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/goals')}
            className="flex-1 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-green-50">
              <Target size={18} color="#16a34a" />
            </View>
            <Text className="text-sm font-semibold text-slate-700">Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Recent students */}
        {students.slice(0, 5).length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-slate-800">Recent Students</Text>
            <View className="gap-2">
              {students.slice(0, 5).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => router.push(`/student/${s.id}` as any)}
                >
                  <Card>
                    <CardContent className="flex-row items-center justify-between pt-3">
                      <View>
                        <Text className="text-sm font-semibold text-slate-800">{s.name}</Text>
                        <Text className="text-xs text-slate-500">{s.universityName}</Text>
                        <Text className="mt-0.5 text-xs text-slate-400">
                          {moment(s.created_date).fromNow()}
                        </Text>
                      </View>
                      <Badge color={pipelineBadgeColor(s.statusPipeline)}>
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
