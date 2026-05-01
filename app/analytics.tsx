import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import moment from 'moment';
import { useAuth } from '@/lib/auth';
import { Entities } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-slate-600">{label}</Text>
        <Text className="text-xs font-semibold text-slate-800">{value}</Text>
      </View>
      <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <View className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState<TimeRange>('month');

  const { data: sessions = [], isLoading: loadS } = useQuery({
    queryKey: ['analyticsSessions', user?.id],
    queryFn: () => Entities.EvangelismSession.filter({ userId: user?.id }, '-created_date', 500),
    enabled: !!user,
  });

  const { data: students = [], isLoading: loadSt } = useQuery({
    queryKey: ['analyticsStudents', user?.id],
    queryFn: () => Entities.Student.filter({ evangelizedByUserId: user?.id }, '-created_date', 500),
    enabled: !!user,
  });

  const subtract: Record<TimeRange, [number, moment.unitOfTime.DurationConstructor]> = {
    week: [1, 'week'], month: [1, 'month'], quarter: [3, 'months'], year: [1, 'year'],
  };
  const cutoff = moment().subtract(...subtract[range]);
  const filteredSessions = (sessions as Record<string, unknown>[]).filter((s) =>
    moment(s.created_date as string).isAfter(cutoff)
  );
  const filteredStudents = (students as Record<string, unknown>[]).filter((s) =>
    moment(s.created_date as string).isAfter(cutoff)
  );

  const totalHours = Math.round(filteredSessions.reduce((acc, s) => acc + ((s.durationMinutes as number) || 0), 0) / 60);

  // Pipeline breakdown
  const pipeline: Record<string, number> = {};
  filteredStudents.forEach((s) => {
    const stage = (s.statusPipeline as string) ?? 'Unknown';
    pipeline[stage] = (pipeline[stage] || 0) + 1;
  });
  const pipelineMax = Math.max(...Object.values(pipeline), 1);

  // Monthly sessions (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => moment().subtract(5 - i, 'months'));
  const monthlyData = months.map((m) => ({
    label: m.format('MMM'),
    count: (sessions as Record<string, unknown>[]).filter((s) =>
      moment(s.created_date as string).isSame(m, 'month')
    ).length,
  }));
  const monthMax = Math.max(...monthlyData.map((m) => m.count), 1);

  const isLoading = loadS || loadSt;

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-4 pt-12 pb-8">
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-800">Analytics</Text>
        </View>

        {/* Range Filter */}
        <View className="flex-row bg-slate-100 rounded-xl p-1 mb-5">
          {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map((r) => (
            <TouchableOpacity key={r} onPress={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-lg items-center ${range === r ? 'bg-white shadow-sm' : ''}`}>
              <Text className={`text-xs font-medium capitalize ${range === r ? 'text-slate-800' : 'text-slate-500'}`}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : (
          <View className="gap-4">
            {/* Summary */}
            <View className="flex-row gap-3">
              {[
                { label: 'Hours', value: totalHours, bg: 'bg-blue-50' },
                { label: 'Sessions', value: filteredSessions.length, bg: 'bg-indigo-50' },
                { label: 'Students', value: filteredStudents.length, bg: 'bg-green-50' },
              ].map((s) => (
                <View key={s.label} className={`flex-1 ${s.bg} rounded-2xl p-4 items-center`}>
                  <Text className="text-2xl font-bold text-slate-800">{s.value}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Monthly Sessions */}
            <Card>
              <CardHeader><CardTitle>Sessions by Month</CardTitle></CardHeader>
              <CardContent>
                {monthlyData.map((m) => (
                  <BarRow key={m.label} label={m.label} value={m.count} max={monthMax} />
                ))}
              </CardContent>
            </Card>

            {/* Pipeline */}
            <Card>
              <CardHeader><CardTitle>Student Pipeline</CardTitle></CardHeader>
              <CardContent>
                {Object.entries(pipeline).length === 0 ? (
                  <Text className="text-sm text-slate-400">No data for this period</Text>
                ) : (
                  Object.entries(pipeline).map(([stage, count]) => (
                    <BarRow key={stage} label={stage} value={count} max={pipelineMax} />
                  ))
                )}
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
