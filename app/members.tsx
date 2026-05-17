import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { UserDB } from '../lib/db';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { UserProfile, UserRole } from '../lib/types';

function roleColor(role?: UserRole | string) {
  if (role === 'Admin') return 'red' as const;
  if (role === 'Evangelism Leader') return 'purple' as const;
  return 'slate' as const;
}

export default function MembersScreen() {
  const [search, setSearch] = useState('');

  const { data: members = [], isFetching, refetch } = useQuery<UserProfile[]>({
    queryKey: ['members'],
    queryFn: () => UserDB.list(),
  });

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <Search size={16} color="#94a3b8" />
          <TextInput
            className="flex-1 py-3 text-sm text-slate-800"
            placeholder="Search members…"
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
        <Text className="py-2 text-xs text-slate-500">{filtered.length} members</Text>
        <View className="gap-2 pb-6">
          {filtered.map((m) => {
            const initials = ((m.full_name ?? m.name ?? m.email ?? '?')[0]).toUpperCase();
            return (
              <Card key={m.id}>
                <CardContent className="flex-row items-center gap-3 pt-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Text className="text-base font-bold text-blue-600">{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-800">
                      {m.full_name ?? m.name ?? m.email}
                    </Text>
                    <Text className="text-xs text-slate-500">{m.chapterName ?? '—'}</Text>
                  </View>
                  <Badge color={roleColor(m.userRole)}>{m.userRole ?? 'Member'}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
