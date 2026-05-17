import React, { useState } from 'react';
import {
  RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search } from 'lucide-react-native';
import moment from 'moment';
import { StudentDB } from '../../lib/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge, pipelineBadgeColor } from '../../components/ui/Badge';
import { PIPELINE_STAGES } from '../../lib/types';
import type { Student } from '../../lib/types';

export default function StudentsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');

  const { data: students = [], isFetching, refetch } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => StudentDB.list('-created_date', 500) as Promise<Student[]>,
  });

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(q) ||
      s.universityName?.toLowerCase().includes(q);
    const matchStage = !stage || s.statusPipeline === stage;
    return matchSearch && matchStage;
  });

  return (
    <View className="flex-1 bg-slate-50">
      <View className="border-b border-slate-200 bg-white px-5 pb-4 pt-14">
        <Text className="text-xl font-bold text-slate-800">Students</Text>
        <Text className="mt-0.5 text-sm text-slate-500">{students.length} contacts</Text>
      </View>

      {/* Search */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <Search size={16} color="#94a3b8" />
          <TextInput
            className="flex-1 py-3 text-sm text-slate-800"
            placeholder="Search by name or university…"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Stage filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
      >
        <TouchableOpacity
          onPress={() => setStage('')}
          className={`rounded-full px-3 py-1.5 ${!stage ? 'bg-blue-600' : 'border border-slate-200 bg-white'}`}
        >
          <Text className={`text-xs font-semibold ${!stage ? 'text-white' : 'text-slate-600'}`}>All</Text>
        </TouchableOpacity>
        {PIPELINE_STAGES.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStage(stage === s ? '' : s)}
            className={`rounded-full px-3 py-1.5 ${stage === s ? 'bg-blue-600' : 'border border-slate-200 bg-white'}`}
          >
            <Text className={`text-xs font-semibold ${stage === s ? 'text-white' : 'text-slate-600'}`}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {filtered.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-sm text-slate-400">No students found</Text>
          </View>
        )}
        <View className="gap-2 pb-6">
          {filtered.map((s) => (
            <TouchableOpacity key={s.id} onPress={() => router.push(`/student/${s.id}` as any)}>
              <Card>
                <CardContent className="flex-row items-center pt-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-800">{s.name}</Text>
                    <Text className="text-xs text-slate-500">{s.universityName}</Text>
                    <View className="mt-1.5">
                      <Badge color={pipelineBadgeColor(s.statusPipeline)}>{s.statusPipeline}</Badge>
                    </View>
                    <Text className="mt-1 text-xs text-slate-400">
                      {moment(s.created_date).fromNow()} · {s.evangelizedByUserName}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#cbd5e1" />
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
