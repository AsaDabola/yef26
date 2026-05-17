import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useAuth } from '../lib/auth';
import { SessionDB, StudentDB } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PIPELINE_STAGES } from '../lib/types';
import type { EvangelismSession, Student } from '../lib/types';

type Range = 'Week' | 'Month' | 'Quarter' | 'Year';

function since(r: Range): Date {
  const d = new Date();
  if (r === 'Week') d.setDate(d.getDate() - 7);
  else if (r === 'Month') d.setMonth(d.getMonth() - 1);
  else if (r === 'Quarter') d.setMonth(d.getMonth() - 3);
  else d.setFullYear(d.getFullYear() - 1);
  return d;
}

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('Month');

  const { data: sessions = [] } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionDB.list('-created_date', 500) as Promise<EvangelismSession[]>,
  });
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => StudentDB.list('-created_date', 500) as Promise<Student[]>,
  });

  const cutoff = since(range);
  const mySessions = sessions.filter((s) => s.userId === user?.id && new Date(s.created_date) >= cutoff);
  const myStudents = students.filter((s) => s.evangelizedByUserId === user?.id && new Date(s.created_date) >= cutoff);

  const hours = Math.round(mySessions.reduce((a, s) => a + (s.durationMinutes || 0), 0) / 60 * 10) / 10;

  // Monthly bars — last 6 months
  const monthBars = Array.from({ length: 6 }, (_, i) => {
    const m = moment().subtract(5 - i, 'months');
    const count = sessions.filter(
      (s) => s.userId === user?.id && moment(s.created_date).isSame(m, 'month'),
    ).length;
    return { label: m.format('MMM'), count };
  });
  const maxBar = Math.max(...monthBars.map((b) => b.count), 1);

  // Pipeline breakdown
  const pipeline = PIPELINE_STAGES
    .map((stage) => ({ stage, count: myStudents.filter((s) => s.statusPipeline === stage).length }))
    .filter((p) => p.count > 0);
  const maxPipeline = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-4 py-4 gap-4">
        {/* Range */}
        <View className="flex-row gap-2">
          {(['Week', 'Month', 'Quarter', 'Year'] as Range[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              className={`flex-1 rounded-xl py-2 ${range === r ? 'bg-blue-600' : 'border border-slate-200 bg-white'}`}
            >
              <Text className={`text-center text-xs font-semibold ${range === r ? 'text-white' : 'text-slate-600'}`}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary stats */}
        <View className="flex-row gap-3">
          {[
            { label: 'Hours',    value: hours },
            { label: 'Sessions', value: mySessions.length },
            { label: 'Students', value: myStudents.length },
          ].map(({ label, value }) => (
            <Card key={label} className="flex-1">
              <CardContent className="items-center pt-3">
                <Text className="text-2xl font-bold text-slate-800">{value}</Text>
                <Text className="text-xs text-slate-500">{label}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Sessions bar chart */}
        <Card>
          <CardHeader><CardTitle>Sessions — Last 6 Months</CardTitle></CardHeader>
          <CardContent>
            <View className="h-32 flex-row items-end gap-2">
              {monthBars.map(({ label, count }) => (
                <View key={label} className="flex-1 items-center gap-1">
                  <Text className="text-xs text-slate-500">{count || ''}</Text>
                  <View
                    className="w-full min-h-[4px] rounded-t-md bg-blue-600"
                    style={{ height: Math.max((count / maxBar) * 80, 4) }}
                  />
                  <Text className="text-xs text-slate-400">{label}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Pipeline chart */}
        {pipeline.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Student Pipeline</CardTitle></CardHeader>
            <CardContent>
              <View className="gap-3">
                {pipeline.map(({ stage, count }) => (
                  <View key={stage} className="gap-1">
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-slate-600">{stage}</Text>
                      <Text className="text-xs font-semibold text-slate-700">{count}</Text>
                    </View>
                    <View className="h-2 rounded-full bg-slate-100">
                      <View
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${(count / maxPipeline) * 100}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
