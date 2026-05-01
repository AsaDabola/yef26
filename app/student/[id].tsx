import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Entities } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import Badge, { pipelineColor } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import moment from 'moment';

const PIPELINE_STAGES = [
  'Evangelized', 'Contact Exchanged', 'Bible Study Started',
  'Bible Study In Progress', 'Visiting Fellowship', 'Connected to Chapter',
  'Discipled / Serving', 'Not Interested / Closed',
].map((s) => ({ label: s, value: s }));

const BIBLE_TOPICS = [
  'Who is God?', 'Who is Jesus?', 'The Holy Spirit', 'Salvation & Grace',
  'Prayer', 'The Church', 'Discipleship', 'The Bible',
];

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showBibleStudy, setShowBibleStudy] = useState(false);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const result = await Entities.Student.filter({}, '-created_date', 1);
      // Fetch by id directly
      const allStudents = await Entities.Student.list('-created_date', 500);
      return (allStudents as Record<string, unknown>[]).find((s) => s.id === id) ?? null;
    },
  });

  const canEdit = user?.userRole === 'Admin' || user?.userRole === 'Evangelism Leader' ||
    (student as Record<string, unknown>)?.evangelizedByUserId === user?.id;

  const updatePipeline = useMutation({
    mutationFn: (stage: string) => Entities.Student.update(id!, { statusPipeline: stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', id] }),
  });

  const deleteStudent = () => {
    Alert.alert('Delete Student', 'Are you sure you want to delete this student?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await Entities.Student.delete(id!);
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!student) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-400">Student not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-600">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const s = student as Record<string, unknown>;

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-slate-100">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center">
            <ArrowLeft size={22} color="#1e293b" />
          </TouchableOpacity>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => router.push(`/student/${id}/chat`)}
              className="w-9 h-9 bg-blue-50 rounded-full items-center justify-center">
              <MessageCircle size={18} color="#2563eb" />
            </TouchableOpacity>
            {canEdit && (
              <TouchableOpacity onPress={deleteStudent}
                className="w-9 h-9 bg-red-50 rounded-full items-center justify-center">
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Profile */}
        <View className="items-center pb-2">
          <View className="w-20 h-20 rounded-2xl bg-blue-100 items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-blue-700">
              {(s.name as string)?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-800">{s.name as string}</Text>
          {Boolean(s.universityName) && <Text className="text-sm text-slate-500 mt-0.5">{s.universityName as string}</Text>}
          <View className="mt-2">
            <Badge variant={pipelineColor(s.statusPipeline as string)}>
              {s.statusPipeline as string}
            </Badge>
          </View>
        </View>
      </View>

      <View className="px-4 py-4 gap-4">
        {/* Contact Info */}
        <Card>
          <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
          <CardContent>
            <View className="gap-2">
              {[
                { label: 'Phone', value: s.phone },
                { label: 'Email', value: s.email },
                { label: 'University', value: s.universityName },
                { label: 'Major', value: s.major },
                { label: 'Year', value: s.collegeYear },
                { label: 'Country', value: s.country },
                { label: 'City', value: s.city },
              ].filter((f) => f.value).map((field) => (
                <View key={field.label} className="flex-row gap-2">
                  <Text className="text-xs font-medium text-slate-400 w-20">{field.label}</Text>
                  <Text className="text-sm text-slate-700 flex-1">{field.value as string}</Text>
                </View>
              ))}
              {Boolean(s.notes) && (
                <View className="mt-2">
                  <Text className="text-xs font-medium text-slate-400 mb-1">Notes</Text>
                  <Text className="text-sm text-slate-700">{s.notes as string}</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Pipeline */}
        {canEdit && (
          <Card>
            <CardHeader><CardTitle>Update Stage</CardTitle></CardHeader>
            <CardContent>
              <Select
                value={s.statusPipeline as string}
                onValueChange={(v) => updatePipeline.mutate(v)}
                options={PIPELINE_STAGES}
              />
            </CardContent>
          </Card>
        )}

        {/* Bible Study */}
        <TouchableOpacity onPress={() => setShowBibleStudy(!showBibleStudy)}>
          <Card>
            <View className="p-4 flex-row items-center justify-between">
              <Text className="font-semibold text-slate-800">Bible Study Topics</Text>
              {showBibleStudy ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
            </View>
            {showBibleStudy && (
              <View className="px-4 pb-4 gap-2">
                {BIBLE_TOPICS.map((topic) => {
                  const topics = (s.bibleStudyTopics as { topic: string; completed: boolean }[] | undefined) ?? [];
                  const entry = topics.find((t) => t.topic === topic);
                  return (
                    <TouchableOpacity
                      key={topic}
                      onPress={() => {
                        const updated = topics.filter((t) => t.topic !== topic);
                        updated.push({ topic, completed: !entry?.completed });
                        Entities.Student.update(id!, { bibleStudyTopics: updated }).then(() =>
                          qc.invalidateQueries({ queryKey: ['student', id] })
                        );
                      }}
                      className="flex-row items-center gap-3"
                    >
                      <View className={`w-5 h-5 rounded border-2 items-center justify-center ${entry?.completed ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                        {entry?.completed && <Text className="text-white text-xs font-bold">✓</Text>}
                      </View>
                      <Text className={`text-sm ${entry?.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>
        </TouchableOpacity>

        {/* Meta */}
        <Text className="text-xs text-slate-400 text-center">
          Added by {s.evangelizedByUserName as string} · {moment(s.created_date as string).format('MMM D, YYYY')}
        </Text>
      </View>
    </ScrollView>
  );
}
