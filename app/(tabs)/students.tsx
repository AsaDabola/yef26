import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search, ChevronRight } from 'lucide-react-native';
import moment from 'moment';
import { Entities } from '../../lib/firestore';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge, pipelineColor } from '../../components/ui/Badge';
import { PIPELINE_STAGES } from '../../lib/types';
import type { Student } from '../../lib/types';

export default function StudentsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const { data: students = [], isFetching, refetch } = useQuery<Student[]>({
    queryKey: ['students-all'],
    queryFn: () => Entities.Student.list('-created_date', 500) as Promise<Student[]>,
  });

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.universityName?.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || s.statusPipeline === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white border-b border-slate-200 pt-14 pb-4 px-5">
        <Text className="text-xl font-bold text-slate-800">Students</Text>
        <Text className="text-sm text-slate-500 mt-0.5">{students.length} total contacts</Text>
      </View>

      {/* Search */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3 gap-2">
          <Search size={16} color="#94a3b8" />
          <TextInput
            className="flex-1 py-3 text-sm text-slate-800"
            placeholder="Search by name or university..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Stage filter */}
      <View className="pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setStageFilter('')}
            className={`px-3 py-1.5 rounded-full ${!stageFilter ? 'bg-blue-600' : 'bg-white border border-slate-200'}`}
          >
            <Text className={`text-xs font-semibold ${!stageFilter ? 'text-white' : 'text-slate-600'}`}>All</Text>
          </TouchableOpacity>
          {PIPELINE_STAGES.map((stage) => (
            <TouchableOpacity
              key={stage}
              onPress={() => setStageFilter(stageFilter === stage ? '' : stage)}
              className={`px-3 py-1.5 rounded-full ${stageFilter === stage ? 'bg-blue-600' : 'bg-white border border-slate-200'}`}
            >
              <Text className={`text-xs font-semibold ${stageFilter === stage ? 'text-white' : 'text-slate-600'}`}>
                {stage}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {filtered.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-slate-400 text-sm">No students found</Text>
          </View>
        )}
        <View className="gap-2 pb-6">
          {filtered.map((s) => (
            <TouchableOpacity key={s.id} onPress={() => router.push(`/student/${s.id}` as any)}>
              <Card>
                <CardContent className="pt-3 flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-800">{s.name}</Text>
                    <Text className="text-xs text-slate-500">{s.universityName}</Text>
                    <View className="flex-row items-center gap-2 mt-1.5">
                      <Badge variant={pipelineColor(s.statusPipeline)}>
                        {s.statusPipeline}
                      </Badge>
                    </View>
                    <Text className="text-xs text-slate-400 mt-1">
                      Added {moment(s.created_date).fromNow()} by {s.evangelizedByUserName}
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
