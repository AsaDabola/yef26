import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Mail, MapPin, MessageCircle, Phone, Trash2 } from 'lucide-react-native';
import moment from 'moment';
import { StudentDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge, pipelineBadgeColor } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { PIPELINE_STAGES } from '../../lib/types';
import type { Student, BibleStudyTopic, PipelineStage } from '../../lib/types';

const BIBLE_TOPICS = [
  'Who is God?', 'Who is Jesus?', 'The Gospel', 'Repentance & Faith',
  'Baptism', 'Holy Spirit', 'Prayer', 'The Church', 'Discipleship', 'Evangelism',
];

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: student, isLoading } = useQuery<Student | null>({
    queryKey: ['student', id],
    queryFn: () => StudentDB.getById(id!) as Promise<Student | null>,
    enabled: !!id,
  });

  const canEdit =
    user?.userRole === 'Admin' ||
    user?.userRole === 'Evangelism Leader' ||
    user?.id === student?.evangelizedByUserId;

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<Student>) =>
      StudentDB.update(id!, patch as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', id] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => StudentDB.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      router.back();
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  function toggleTopic(topic: string) {
    if (!student || !canEdit) return;
    const existing: BibleStudyTopic[] = student.bibleStudyTopics ?? [];
    const found = existing.find((t) => t.topic === topic);
    const updated: BibleStudyTopic[] = found
      ? existing.map((t) => (t.topic === topic ? { ...t, completed: !t.completed } : t))
      : [...existing, { topic, completed: true }];
    updateMutation.mutate({ bibleStudyTopics: updated });
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-400">Loading…</Text>
      </View>
    );
  }
  if (!student) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-400">Student not found</Text>
      </View>
    );
  }

  const topics = student.bibleStudyTopics ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="border-b border-slate-200 bg-white px-5 py-6">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-xl font-bold text-slate-800">{student.name}</Text>
            <View className="mt-1 flex-row items-center gap-1">
              <GraduationCap size={13} color="#64748b" />
              <Text className="text-sm text-slate-500">{student.universityName}</Text>
            </View>
            {(student.city || student.country) ? (
              <View className="mt-0.5 flex-row items-center gap-1">
                <MapPin size={13} color="#64748b" />
                <Text className="text-sm text-slate-500">
                  {[student.city, student.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
          <Badge color={pipelineBadgeColor(student.statusPipeline)}>
            {student.statusPipeline}
          </Badge>
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {student.phone ? (
            <View className="flex-row items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2">
              <Phone size={13} color="#475569" />
              <Text className="text-xs text-slate-600">{student.phone}</Text>
            </View>
          ) : null}
          {student.email ? (
            <View className="flex-row items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2">
              <Mail size={13} color="#475569" />
              <Text className="text-xs text-slate-600">{student.email}</Text>
            </View>
          ) : null}
        </View>

        <Text className="mt-3 text-xs text-slate-400">
          Added {moment(student.created_date).fromNow()} by {student.evangelizedByUserName}
        </Text>
      </View>

      <View className="px-4 py-4 gap-4">
        {/* Pipeline */}
        {canEdit && (
          <Card>
            <CardHeader><CardTitle>Pipeline Stage</CardTitle></CardHeader>
            <CardContent>
              <Select
                value={student.statusPipeline}
                onValueChange={(v) => updateMutation.mutate({ statusPipeline: v as PipelineStage })}
                options={PIPELINE_STAGES.map((s) => ({ label: s, value: s }))}
              />
            </CardContent>
          </Card>
        )}

        {/* Bible study checklist */}
        <Card>
          <CardHeader><CardTitle>Bible Study Topics</CardTitle></CardHeader>
          <CardContent>
            <View className="gap-2">
              {BIBLE_TOPICS.map((topic) => {
                const done = topics.find((t) => t.topic === topic)?.completed ?? false;
                return (
                  <TouchableOpacity
                    key={topic}
                    onPress={() => toggleTopic(topic)}
                    disabled={!canEdit}
                    activeOpacity={canEdit ? 0.7 : 1}
                    className={`flex-row items-center gap-3 rounded-xl border p-3 ${
                      done ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <View
                      className={`h-5 w-5 items-center justify-center rounded border-2 ${
                        done ? 'border-green-500 bg-green-500' : 'border-slate-300'
                      }`}
                    >
                      {done && <Text className="text-xs font-bold text-white">✓</Text>}
                    </View>
                    <Text className={`text-sm ${done ? 'font-medium text-green-800' : 'text-slate-700'}`}>
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
              <Text className="text-sm leading-relaxed text-slate-600">{student.notes}</Text>
            </CardContent>
          </Card>
        ) : null}

        {/* Actions */}
        <Button variant="outline" onPress={() => router.push(`/student/${id}/chat` as any)} fullWidth>
          <MessageCircle size={16} color="#475569" />
          <Text className="text-sm font-semibold text-slate-700">Notes & Chat</Text>
        </Button>

        {canEdit && (
          <Button
            variant="destructive"
            onPress={() => {
              Alert.alert('Delete Student', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
              ]);
            }}
            loading={deleteMutation.isPending}
            fullWidth
          >
            <Trash2 size={16} color="#fff" />
            <Text className="text-sm font-semibold text-white">Delete Student</Text>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
