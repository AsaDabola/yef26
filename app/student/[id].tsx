import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Trash2, Phone, Mail, GraduationCap, MapPin } from 'lucide-react-native';
import moment from 'moment';
import { Entities } from '../../lib/firestore';
import { useAuth } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge, pipelineColor } from '../../components/ui/Badge';
import { PIPELINE_STAGES } from '../../lib/types';
import type { Student, BibleStudyTopic } from '../../lib/types';

const BIBLE_TOPICS = [
  'Who is God?',
  'Who is Jesus?',
  'The Gospel',
  'Repentance & Faith',
  'Baptism',
  'Holy Spirit',
  'Prayer',
  'The Church',
  'Discipleship',
  'Evangelism',
];

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: student, isLoading } = useQuery<Student | undefined>({
    queryKey: ['student', id],
    queryFn: async () => {
      const all = await Entities.Student.list('-created_date', 500);
      return (all as Student[]).find((s) => s.id === id);
    },
    enabled: !!id,
  });

  const canEdit =
    user?.id === student?.evangelizedByUserId ||
    user?.userRole === 'Admin' ||
    user?.userRole === 'Evangelism Leader';

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<Student>) =>
      Entities.Student.update(id!, patch as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', id] });
      qc.invalidateQueries({ queryKey: ['students-all'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => Entities.Student.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students-all'] });
      router.back();
    },
  });

  function handleDeleteConfirm() {
    Alert.alert('Delete Student', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  function toggleTopic(topic: string) {
    if (!student || !canEdit) return;
    const existing: BibleStudyTopic[] = student.bibleStudyTopics ?? [];
    const found = existing.find((t) => t.topic === topic);
    let updated: BibleStudyTopic[];
    if (found) {
      updated = existing.map((t) => t.topic === topic ? { ...t, completed: !t.completed } : t);
    } else {
      updated = [...existing, { topic, completed: true }];
    }
    updateMutation.mutate({ bibleStudyTopics: updated });
  }

  if (isLoading || !student) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">Loading...</Text>
      </View>
    );
  }

  const topics = student.bibleStudyTopics ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Profile header */}
      <View className="bg-white px-5 py-6 border-b border-slate-200">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-800">{student.name}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <GraduationCap size={13} color="#64748b" />
              <Text className="text-sm text-slate-500">{student.universityName}</Text>
            </View>
            {student.city || student.country ? (
              <View className="flex-row items-center gap-1 mt-0.5">
                <MapPin size={13} color="#64748b" />
                <Text className="text-sm text-slate-500">
                  {[student.city, student.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
          <Badge variant={pipelineColor(student.statusPipeline)}>
            {student.statusPipeline}
          </Badge>
        </View>

        {/* Contact buttons */}
        <View className="flex-row gap-2 mt-4">
          {student.phone ? (
            <TouchableOpacity className="flex-row items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-2">
              <Phone size={14} color="#475569" />
              <Text className="text-xs text-slate-600">{student.phone}</Text>
            </TouchableOpacity>
          ) : null}
          {student.email ? (
            <TouchableOpacity className="flex-row items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-2">
              <Mail size={14} color="#475569" />
              <Text className="text-xs text-slate-600">{student.email}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text className="text-xs text-slate-400 mt-3">
          Added {moment(student.created_date).fromNow()} by {student.evangelizedByUserName}
        </Text>
      </View>

      <View className="px-4 py-4 gap-4">
        {/* Pipeline stage */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={student.statusPipeline}
                onValueChange={(v) => updateMutation.mutate({ statusPipeline: v as any })}
                options={PIPELINE_STAGES.map((s) => ({ label: s, value: s }))}
              />
            </CardContent>
          </Card>
        )}

        {/* Bible study topics */}
        <Card>
          <CardHeader>
            <CardTitle>Bible Study Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-2">
              {BIBLE_TOPICS.map((topic) => {
                const entry = topics.find((t) => t.topic === topic);
                const done = entry?.completed ?? false;
                return (
                  <TouchableOpacity
                    key={topic}
                    onPress={() => toggleTopic(topic)}
                    disabled={!canEdit}
                    className={`flex-row items-center gap-3 p-3 rounded-xl border ${
                      done ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                    }`}
                    activeOpacity={canEdit ? 0.7 : 1}
                  >
                    <View className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                      done ? 'bg-green-500 border-green-500' : 'border-slate-300'
                    }`}>
                      {done && <Text className="text-white text-xs">✓</Text>}
                    </View>
                    <Text className={`text-sm ${done ? 'text-green-800 font-medium' : 'text-slate-700'}`}>
                      {topic}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CardContent>
        </Card>

        {/* Notes */}
        {student.notes ? (
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <Text className="text-sm text-slate-600 leading-relaxed">{student.notes}</Text>
            </CardContent>
          </Card>
        ) : null}

        {/* Chat button */}
        <Button
          variant="outline"
          onPress={() => router.push(`/student/${id}/chat` as any)}
        >
          <MessageCircle size={16} color="#475569" />
          <Text className="text-sm font-semibold text-slate-700">Open Chat</Text>
        </Button>

        {/* Delete */}
        {canEdit && (
          <Button
            variant="destructive"
            onPress={handleDeleteConfirm}
            loading={deleteMutation.isPending}
          >
            <Trash2 size={16} color="#fff" />
            <Text className="text-sm font-semibold text-white">Delete Student</Text>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
