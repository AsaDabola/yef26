import React from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { UserDB } from '../lib/db';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import type { UserProfile, UserRole } from '../lib/types';

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Member',            value: 'Member' },
  { label: 'Evangelism Leader', value: 'Evangelism Leader' },
  { label: 'Admin',             value: 'Admin' },
];

function roleColor(role?: UserRole | string) {
  if (role === 'Admin') return 'red' as const;
  if (role === 'Evangelism Leader') return 'purple' as const;
  return 'slate' as const;
}

export default function ManageRolesScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: members = [], isFetching, refetch } = useQuery<UserProfile[]>({
    queryKey: ['members'],
    queryFn: () => UserDB.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      UserDB.update(id, { userRole: role }),
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
          Manage roles for {others.length} members. You cannot change your own role.
        </Text>
        {others.map((m) => (
          <Card key={m.id}>
            <CardContent className="pt-3">
              <View className="mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-slate-800">
                    {m.full_name ?? m.name ?? m.email}
                  </Text>
                  <Text className="text-xs text-slate-500">{m.email}</Text>
                  <Text className="text-xs text-slate-400">{m.chapterName}</Text>
                </View>
                <Badge color={roleColor(m.userRole)}>{m.userRole ?? 'Member'}</Badge>
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
