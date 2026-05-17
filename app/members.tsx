import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react-native';
import { Entities } from '../lib/firestore';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { UserProfile } from '../lib/types';

export default function MembersScreen() {
  const [search, setSearch] = useState('');

  const { data: members = [], isFetching, refetch } = useQuery<UserProfile[]>({
    queryKey: ['members'],
    queryFn: () => Entities.User.list() as Promise<UserProfile[]>,
  });

  const filtered = members.filter(
    (m) =>
      !search ||
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role?: string) => {
    if (role === 'Admin') return 'red' as const;
    if (role === 'Evangelism Leader') return 'purple' as const;
    return 'default' as const;
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3 gap-2">
          <Search size={16} color="#94a3b8" />
          <TextInput
            className="flex-1 py-3 text-sm text-slate-800"
            placeholder="Search members..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <Text className="text-xs text-slate-500 py-2">{filtered.length} members</Text>
        <View className="gap-2 pb-6">
          {filtered.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-3 flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                  <Text className="text-blue-600 font-bold text-base">
                    {((m.full_name ?? m.name ?? m.email ?? '?')[0]).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-800">
                    {m.full_name ?? m.name ?? m.email}
                  </Text>
                  <Text className="text-xs text-slate-500">{m.chapterName ?? '—'}</Text>
                </View>
                <Badge variant={roleColor(m.userRole)}>
                  {m.userRole ?? 'Member'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
