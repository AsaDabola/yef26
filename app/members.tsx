import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Entities, type UserProfile } from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function MembersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => Entities.User.list(),
  });

  const filtered = (members as UserProfile[]).filter((m) =>
    !search ||
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role?: string) => {
    if (role === 'Admin') return 'red' as const;
    if (role === 'Evangelism Leader') return 'purple' as const;
    return 'default' as const;
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-4 pt-12 pb-4 bg-white border-b border-slate-100">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-800">Members</Text>
        </View>
        <View className="flex-row items-center bg-slate-100 rounded-xl px-3 py-2 gap-2">
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search members..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-sm text-slate-800"
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2563eb" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-slate-400">No members found</Text>
            </View>
          }
          renderItem={({ item: member }) => (
            <Card className="p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-blue-100 items-center justify-center">
                  <Text className="text-blue-700 font-semibold text-sm">
                    {member.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-800">{member.full_name}</Text>
                  <Text className="text-xs text-slate-500">{member.chapterName ?? 'No chapter'}</Text>
                </View>
                <Badge variant={roleColor(member.userRole)}>{member.userRole ?? 'Member'}</Badge>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
