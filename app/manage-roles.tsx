import React from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Entities } from '../lib/firestore';
import { useAuth } from '../lib/auth';
import { Card, CardContent } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import type { UserProfile, UserRole } from '../lib/types';

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Member', value: 'Member' },
  { label: 'Evangelism Leader', value: 'Evangelism Leader' },
  { label: 'Admin', value: 'Admin' },
];

const roleColor = (role?: string) => {
  if (role === 'Admin') return 'red' as const;
  if (role === 'Evangelism Leader') return 'purple' as const;
  return 'default' as const;
};

export default function ManageRolesScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: members = [], isFetching, refetch } = useQuery<UserProfile[]>({
    queryKey: ['members'],
    queryFn: () => Entities.User.list() as Promise<UserProfile[]>,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      Entities.User.update(id, { userRole: role, role: role.toLowerCase() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const others = members.filter((m) => m.id !== user?.id);

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View className="px-4 py-4 gap-3">
        <Text className="text-xs text-slate-500">
          Showing {others.length} members. You cannot change your own role.
        </Text>
        {others.map((m) => (
          <Card key={m.id}>
            <CardContent className="pt-3">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-sm font-semibold text-slate-800">
                    {m.full_name ?? m.name ?? m.email}
                  </Text>
                  <Text className="text-xs text-slate-500">{m.email}</Text>
                  <Text className="text-xs text-slate-400">{m.chapterName}</Text>
                </View>
                <Badge variant={roleColor(m.userRole)}>{m.userRole ?? 'Member'}</Badge>
              </View>
              <Select
                value={m.userRole ?? 'Member'}
                onValueChange={(v) => updateMutation.mutate({ id: m.id, role: v as UserRole })}
                options={ROLES}
                placeholder="Select role"
              />
            </CardContent>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
