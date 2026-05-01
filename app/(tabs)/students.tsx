import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search, Filter, UserPlus, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Entities } from '@/lib/firestore';
import Badge, { pipelineColor } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const PIPELINE_STAGES = [
  'All', 'Evangelized', 'Contact Exchanged', 'Bible Study Started',
  'Bible Study In Progress', 'Visiting Fellowship', 'Connected to Chapter',
  'Discipled / Serving', 'Not Interested / Closed',
];

export default function StudentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const { data: students = [], isLoading, refetch } = useQuery({
    queryKey: ['allStudents', user?.chapterId],
    queryFn: () =>
      user?.chapterId
        ? Entities.Student.filter({ evangelizedByChapterId: user.chapterId }, '-created_date', 200)
        : Entities.Student.list('-created_date', 200),
    enabled: !!user,
  });

  const filtered = (students as Record<string, unknown>[]).filter((s) => {
    const matchSearch = !search ||
      (s.name as string)?.toLowerCase().includes(search.toLowerCase()) ||
      (s.universityName as string)?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || s.statusPipeline === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white border-b border-slate-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-slate-800">Students</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/add')}
            className="w-9 h-9 bg-blue-600 rounded-full items-center justify-center"
          >
            <UserPlus size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Search */}
        <View className="flex-row items-center bg-slate-100 rounded-xl px-3 py-2 gap-2 mb-3">
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search students..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-sm text-slate-800"
          />
        </View>
        {/* Pipeline Filter */}
        <FlatList
          data={PIPELINE_STAGES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setStageFilter(item)}
              className={`mr-2 px-3 py-1.5 rounded-full border ${
                stageFilter === item ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white'
              }`}
            >
              <Text className={`text-xs font-medium ${stageFilter === item ? 'text-white' : 'text-slate-600'}`}>
                {item === 'All' ? item : item.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id as string}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <UserPlus size={40} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3">No students found</Text>
            </View>
          }
          renderItem={({ item: student }) => (
            <TouchableOpacity onPress={() => router.push(`/student/${student.id}`)}>
              <Card className="p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-11 h-11 rounded-full bg-blue-50 items-center justify-center">
                    <Text className="text-blue-700 font-semibold text-sm">
                      {(student.name as string)?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="font-semibold text-slate-800" numberOfLines={1}>{student.name as string}</Text>
                    <Text className="text-xs text-slate-500" numberOfLines={1}>{student.universityName as string}</Text>
                    <Text className="text-xs text-slate-400">
                      {student.phone as string}{student.phone && student.email ? ' · ' : ''}{student.email as string}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Badge variant={pipelineColor(student.statusPipeline as string)}>
                      {(student.statusPipeline as string)?.split(' ')[0] ?? '—'}
                    </Badge>
                    <ChevronRight size={14} color="#94a3b8" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Count */}
      <View className="px-4 py-2 bg-white border-t border-slate-100">
        <Text className="text-xs text-slate-400 text-center">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  );
}
