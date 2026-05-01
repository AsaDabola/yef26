import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Entities, type UserProfile } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';

const ROLES = [
  { label: 'Member', value: 'Member' },
  { label: 'Evangelism Leader', value: 'Evangelism Leader' },
  { label: 'Admin', value: 'Admin' },
];

export default function ManageRolesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  if (user?.userRole !== 'Admin') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-400">Admin access required</Text>
      </View>
    );
  }

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['membersRoles'],
    queryFn: () => Entities.User.list(),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      Entities.User.update(id, { userRole: role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['membersRoles'] }),
  });

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-4 pt-12 pb-4 bg-white border-b border-slate-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-800">Manage Roles</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2563eb" /></View>
      ) : (
        <FlatList
          data={members as UserProfile[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item: member }) => (
            <Card className="p-4">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                  <Text className="text-blue-700 font-semibold text-sm">
                    {member.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-800">{member.full_name}</Text>
                  <Text className="text-xs text-slate-500">{member.email}</Text>
                </View>
              </View>
              <Select
                value={member.userRole ?? 'Member'}
                onValueChange={(role) => {
                  if (member.id === user?.id) {
                    Alert.alert('Note', "You can't change your own role.");
                    return;
                  }
                  updateRole.mutate({ id: member.id, role });
                }}
                options={ROLES}
              />
            </Card>
          )}
        />
      )}
    </View>
  );
}
