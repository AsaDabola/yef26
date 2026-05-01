import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, MapPin, Users } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Entities } from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import moment from 'moment';

export default function SessionLogsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessionLogs', user?.id],
    queryFn: () => Entities.EvangelismSession.filter({ userId: user?.id }, '-created_date', 200),
    enabled: !!user,
  });

  const totalHours = Math.round(
    (sessions as Record<string, unknown>[]).reduce((acc, s) => acc + ((s.durationMinutes as number) || 0), 0) / 60
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-4 pt-12 pb-4 bg-white border-b border-slate-100">
        <View className="flex-row items-center gap-3 mb-1">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-800">Session Logs</Text>
        </View>
        <Text className="text-sm text-slate-500 ml-8">{sessions.length} sessions · {totalHours} hours total</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2563eb" /></View>
      ) : (
        <FlatList
          data={sessions as Record<string, unknown>[]}
          keyExtractor={(item) => item.id as string}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-slate-400">No sessions yet</Text>
            </View>
          }
          renderItem={({ item: session }) => {
            const mins = (session.durationMinutes as number) || 0;
            const hrs = Math.floor(mins / 60);
            const remaining = mins % 60;
            const duration = hrs > 0 ? `${hrs}h ${remaining}m` : `${mins}m`;
            return (
              <Card className="p-4">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="font-semibold text-slate-800">
                    {moment(session.startTime as string).format('MMMM D, YYYY')}
                  </Text>
                  <Text className="text-sm font-bold text-blue-600">{duration}</Text>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#94a3b8" />
                    <Text className="text-xs text-slate-500">
                      {moment(session.startTime as string).format('h:mm A')} –{' '}
                      {session.endTime ? moment(session.endTime as string).format('h:mm A') : 'ongoing'}
                    </Text>
                  </View>
                  {Boolean(session.locationName) && (
                    <View className="flex-row items-center gap-1">
                      <MapPin size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-500">{session.locationName as string}</Text>
                    </View>
                  )}
                  <View className="flex-row items-center gap-1">
                    <Users size={12} color="#94a3b8" />
                    <Text className="text-xs text-slate-500">{session.modeType as string}</Text>
                  </View>
                </View>
                {(session.studentIds as string[] | undefined)?.length ? (
                  <Text className="text-xs text-slate-400 mt-1">
                    {(session.studentIds as string[]).length} student{(session.studentIds as string[]).length !== 1 ? 's' : ''} added
                  </Text>
                ) : null}
                {Boolean(session.notes) && (
                  <Text className="text-xs text-slate-500 mt-2 italic">{session.notes as string}</Text>
                )}
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}
