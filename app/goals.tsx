import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Entities } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';

const GOAL_TYPES = [
  { label: 'Sessions per week', value: 'sessions_week' },
  { label: 'Hours per week', value: 'hours_week' },
  { label: 'Students per month', value: 'students_month' },
  { label: 'Bible studies per month', value: 'bible_studies_month' },
];

export default function GoalsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: '', target: '' });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => Entities.Goal.filter({ userId: user?.id }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['goalsessions', user?.id],
    queryFn: () => Entities.EvangelismSession.filter({ userId: user?.id }, '-created_date', 200),
    enabled: !!user,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['goalstudents', user?.id],
    queryFn: () => Entities.Student.filter({ evangelizedByUserId: user?.id }, '-created_date', 200),
    enabled: !!user,
  });

  const addGoal = useMutation({
    mutationFn: () => Entities.Goal.create({
      userId: user?.id, type: form.type, target: Number(form.target), status: 'active',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] });
      setShowAdd(false);
      setForm({ type: '', target: '' });
    },
  });

  const deleteGoal = async (id: string) => {
    await Entities.Goal.delete(id);
    qc.invalidateQueries({ queryKey: ['goals', user?.id] });
  };

  function getProgress(goalType: string): number {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const s = sessions as Record<string, unknown>[];
    const st = students as Record<string, unknown>[];

    switch (goalType) {
      case 'sessions_week':
        return s.filter((x) => new Date(x.created_date as string) >= weekAgo).length;
      case 'hours_week': {
        const mins = s.filter((x) => new Date(x.created_date as string) >= weekAgo)
          .reduce((acc, x) => acc + ((x.durationMinutes as number) || 0), 0);
        return Math.round(mins / 60);
      }
      case 'students_month':
        return st.filter((x) => new Date(x.created_date as string) >= monthAgo).length;
      case 'bible_studies_month':
        return st.filter((x) =>
          new Date(x.created_date as string) >= monthAgo &&
          ['Bible Study Started', 'Bible Study In Progress'].includes(x.statusPipeline as string)
        ).length;
      default: return 0;
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={22} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-slate-800">Goals</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAdd(true)}
            className="w-9 h-9 bg-blue-600 rounded-full items-center justify-center">
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="items-center py-16"><ActivityIndicator color="#2563eb" /></View>
        ) : (goals as Record<string, unknown>[]).length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">🎯</Text>
            <Text className="text-slate-400 text-sm">No goals yet. Set your first goal!</Text>
          </View>
        ) : (
          <View className="gap-4">
            {(goals as Record<string, unknown>[]).map((goal) => {
              const progress = getProgress(goal.type as string);
              const target = goal.target as number;
              const pct = Math.min(Math.round((progress / target) * 100), 100);
              const achieved = progress >= target;
              const label = GOAL_TYPES.find((t) => t.value === goal.type)?.label ?? goal.type as string;
              return (
                <Card key={goal.id as string}>
                  <CardHeader>
                    <View className="flex-row items-center justify-between">
                      <CardTitle>{label}</CardTitle>
                      <View className="flex-row items-center gap-2">
                        {achieved && <Badge variant="green">Done ✓</Badge>}
                        <TouchableOpacity onPress={() => deleteGoal(goal.id as string)}>
                          <Trash2 size={16} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </CardHeader>
                  <CardContent>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm text-slate-600">Progress</Text>
                      <Text className="text-sm font-semibold text-slate-800">{progress} / {target}</Text>
                    </View>
                    <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <View
                        className={`h-full rounded-full ${achieved ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                    <Text className="text-xs text-slate-400 mt-1 text-right">{pct}%</Text>
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-slate-800">New Goal</Text>
                <TouchableOpacity onPress={() => setShowAdd(false)}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <View className="space-y-4">
                <Select label="Goal Type" value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })} options={GOAL_TYPES} />
                <Input label="Target Number" value={form.target}
                  onChangeText={(v) => setForm({ ...form, target: v })}
                  keyboardType="numeric" placeholder="e.g., 5" />
                <Button onPress={() => addGoal.mutate()} disabled={!form.type || !form.target} loading={addGoal.isPending}>
                  Add Goal
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
