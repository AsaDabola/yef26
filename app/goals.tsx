import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, Pencil, Check } from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { Entities, getGoalProgress } from '../lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { Goal, GoalType } from '../lib/types';

const GOAL_DEFS: { type: GoalType; label: string; unit: string }[] = [
  { type: 'sessions_week', label: 'Sessions per Week', unit: 'sessions' },
  { type: 'hours_week', label: 'Hours per Week', unit: 'hours' },
  { type: 'students_month', label: 'Students per Month', unit: 'students' },
  { type: 'bible_studies_month', label: 'Bible Studies per Month', unit: 'bible studies' },
];

export default function GoalsScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<GoalType | null>(null);
  const [inputVal, setInputVal] = useState('');

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals', user?.id],
    queryFn: () =>
      Entities.Goal.filter({ userId: user?.id, status: 'active' }) as Promise<Goal[]>,
    enabled: !!user?.id,
  });

  const { data: progressMap = {} } = useQuery<Record<GoalType, number>>({
    queryKey: ['goal-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return {} as Record<GoalType, number>;
      const entries = await Promise.all(
        GOAL_DEFS.map(async ({ type }) => [type, await getGoalProgress(user.id, type)])
      );
      return Object.fromEntries(entries) as Record<GoalType, number>;
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, target }: { type: GoalType; target: number }) => {
      const existing = goals.find((g) => g.type === type);
      if (existing) {
        await Entities.Goal.update(existing.id, { target });
      } else {
        await Entities.Goal.create({ userId: user?.id, type, target, status: 'active' });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] });
      setEditing(null);
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  function startEdit(type: GoalType) {
    const g = goals.find((g) => g.type === type);
    setInputVal(g ? String(g.target) : '');
    setEditing(type);
  }

  function handleSave(type: GoalType) {
    const n = Number(inputVal);
    if (!n || n <= 0) { Alert.alert('Invalid', 'Enter a positive number'); return; }
    saveMutation.mutate({ type, target: n });
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-4 py-4 gap-4">
        {GOAL_DEFS.map(({ type, label, unit }) => {
          const goal = goals.find((g) => g.type === type);
          const progress = progressMap[type] ?? 0;
          const target = goal?.target ?? 0;
          const pct = target > 0 ? Math.min(progress / target, 1) : 0;
          const isEdit = editing === type;

          return (
            <Card key={type}>
              <CardHeader>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Target size={16} color="#2563eb" />
                    <CardTitle>{label}</CardTitle>
                  </View>
                  <TouchableOpacity onPress={() => startEdit(type)}>
                    {isEdit ? (
                      <Check size={18} color="#16a34a" onPress={() => handleSave(type)} />
                    ) : (
                      <Pencil size={16} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
              </CardHeader>
              <CardContent>
                {isEdit ? (
                  <View className="flex-row items-center gap-3">
                    <TextInput
                      className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm"
                      value={inputVal}
                      onChangeText={setInputVal}
                      keyboardType="numeric"
                      placeholder={`Target ${unit}`}
                      placeholderTextColor="#94a3b8"
                      autoFocus
                    />
                    <Button onPress={() => handleSave(type)} loading={saveMutation.isPending} className="px-4 py-2.5">
                      Save
                    </Button>
                  </View>
                ) : goal ? (
                  <View className="gap-2">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-600">
                        {progress} / {goal.target} {unit}
                      </Text>
                      <Text className="text-sm font-semibold text-blue-600">
                        {Math.round(pct * 100)}%
                      </Text>
                    </View>
                    <View className="h-2.5 bg-slate-100 rounded-full">
                      <View
                        className={`h-2.5 rounded-full ${pct >= 1 ? 'bg-green-500' : 'bg-blue-600'}`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => startEdit(type)}
                    className="flex-row items-center gap-2 py-2"
                  >
                    <Plus size={16} color="#2563eb" />
                    <Text className="text-sm text-blue-600 font-medium">Set goal</Text>
                  </TouchableOpacity>
                )}
              </CardContent>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
