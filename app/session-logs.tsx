import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Users } from 'lucide-react-native';
import moment from 'moment';
import { useAuth } from '../lib/auth';
import { SessionDB } from '../lib/db';
import { Card, CardContent } from '../components/ui/Card';
import type { EvangelismSession } from '../lib/types';

export default function SessionLogsScreen() {
  const { user } = useAuth();

  const { data: sessions = [], isFetching, refetch } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionDB.list('-created_date', 500) as Promise<EvangelismSession[]>,
  });

  const mine = sessions.filter((s) => s.userId === user?.id);

  function duration(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View className="px-4 py-4 gap-3">
        <Text className="text-xs text-slate-500">{mine.length} sessions logged</Text>
        {mine.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-sm text-slate-400">No sessions yet</Text>
          </View>
        )}
        {mine.map((s) => (
          <Card key={s.id}>
            <CardContent className="pt-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-800">
                  {moment(s.startTime).format('MMM D, YYYY')}
                </Text>
                <View className="rounded-lg bg-blue-50 px-2 py-1">
                  <Text className="text-xs font-semibold text-blue-700">{s.modeType}</Text>
                </View>
              </View>
              <Text className="mb-3 text-xs text-slate-500">
                {moment(s.startTime).format('h:mm A')} — {moment(s.endTime).format('h:mm A')}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                <View className="flex-row items-center gap-1">
                  <Clock size={13} color="#64748b" />
                  <Text className="text-xs text-slate-500">{duration(s.durationMinutes || 0)}</Text>
                </View>
                {s.locationName ? (
                  <View className="flex-row items-center gap-1">
                    <MapPin size={13} color="#64748b" />
                    <Text className="text-xs text-slate-500">{s.locationName}</Text>
                  </View>
                ) : null}
                <View className="flex-row items-center gap-1">
                  <Users size={13} color="#64748b" />
                  <Text className="text-xs text-slate-500">{s.studentIds?.length ?? 0} students</Text>
                </View>
              </View>
              {s.notes ? (
                <Text className="mt-2 text-xs italic text-slate-400">"{s.notes}"</Text>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
