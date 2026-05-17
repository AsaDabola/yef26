import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Users } from 'lucide-react-native';
import moment from 'moment';
import { useAuth } from '../lib/auth';
import { Entities } from '../lib/firestore';
import { Card, CardContent } from '../components/ui/Card';
import type { EvangelismSession } from '../lib/types';

export default function SessionLogsScreen() {
  const { user } = useAuth();

  const { data: sessions = [], isFetching, refetch } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions-all'],
    queryFn: () => Entities.EvangelismSession.list('-created_date', 500) as Promise<EvangelismSession[]>,
  });

  const mySessions = sessions.filter((s) => s.userId === user?.id);

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View className="px-4 py-4 gap-3">
        {mySessions.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-slate-400 text-sm">No sessions logged yet</Text>
          </View>
        )}
        {mySessions.map((session) => {
          const hrs = Math.floor((session.durationMinutes ?? 0) / 60);
          const mins = (session.durationMinutes ?? 0) % 60;
          const duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

          return (
            <Card key={session.id}>
              <CardContent className="pt-4">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-sm font-semibold text-slate-800">
                    {moment(session.startTime).format('MMM D, YYYY')}
                  </Text>
                  <View className="bg-blue-50 rounded-lg px-2 py-1">
                    <Text className="text-xs font-semibold text-blue-700">{session.modeType}</Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mb-3">
                  {moment(session.startTime).format('h:mm A')} — {moment(session.endTime).format('h:mm A')}
                </Text>

                <View className="flex-row gap-4">
                  <View className="flex-row items-center gap-1">
                    <Clock size={13} color="#64748b" />
                    <Text className="text-xs text-slate-500">{duration}</Text>
                  </View>
                  {session.locationName ? (
                    <View className="flex-row items-center gap-1">
                      <MapPin size={13} color="#64748b" />
                      <Text className="text-xs text-slate-500">{session.locationName}</Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center gap-1">
                    <Users size={13} color="#64748b" />
                    <Text className="text-xs text-slate-500">{session.studentIds?.length ?? 0} students</Text>
                  </View>
                </View>

                {session.notes ? (
                  <Text className="text-xs text-slate-500 mt-2 italic">"{session.notes}"</Text>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
