import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Target } from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { GoalDB, getGoalProgress } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { Goal, GoalType } from '../lib/types';

const GOAL_DEFS: { type: GoalType; label: string; unit: string }[] = [
  { type: 'sessions_week',        label: 'Sessions per Week',       unit: 'sessions' },
  { type: 'hours_week',           label: 'Hours per Week',          unit: 'hours' },
  { type: 'students_month',       label: 'Students per Month',      unit: 'students' },
  { type: 'bible_studies_month',  label: 'Bible Studies per Month', unit: 'bible studies' },
];

export default function GoalsScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<GoalType | null>(null);
  const [val, setVal] = useState('');

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals', user?.id],
    queryFn: () => GoalDB.filter({ userId: user?.id, status: 'active' }) as Promise<Goal[]>,
    enabled: !!user?.id,
  });

  const { data: progress = {} as Record<GoalType, number> } = useQuery<Record<GoalType, number>>({
    queryKey: ['goal-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return {} as Record<GoalType, number>;
      const pairs = await Promise.all(
        GOAL_DEFS.map(async ({ type }) => [type, await getGoalProgress(user.id, type)] as const),
      );
      return Object.fromEntries(pairs) as Record<GoalType, number>;
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, target }: { type: GoalType; target: number }) => {
      const existing = goals.find((g) => g.type === type);
      if (existing) {
        await GoalDB.update(existing.id, { target });
      } else {
        await GoalDB.create({ userId: user?.id, type, target, status: 'active' });
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
    setVal(g ? String(g.target) : '');
    setEditing(type);
  }

  function save(type: GoalType) {
    const n = Number(val);
    if (!n || n <= 0) { Alert.alert('Invalid', 'Enter a number greater than 0'); return; }
    saveMutation.mutate({ type, target: n });
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-4 py-4 gap-4">
        {GOAL_DEFS.map(({ type, label, unit }) => {
          const goal = goals.find((g) => g.type === type);
          const current = progress[type] ?? 0;
          const target = goal?.target ?? 0;
          const pct = target > 0 ? Math.min(current / target, 1) : 0;
          const isEditing = editing === type;

          return (
            <Card key={type}>
              <CardHeader>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Target size={16} color="#2563eb" />
                    <CardTitle>{label}</CardTitle>
                  </View>
                  <TouchableOpacity onPress={() => startEdit(type)} className="p-1">
                    <Pencil size={15} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <View className="flex-row items-center gap-3">
                    <TextInput
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900"
                      value={val}
                      onChangeText={setVal}
                      keyboardType="numeric"
                      placeholder={`Target ${unit}`}
                      placeholderTextColor="#94a3b8"
                      autoFocus
                    />
                    <Button onPress={() => save(type)} loading={saveMutation.isPending} className="px-5 py-2.5">
                      Save
                    </Button>
                    <Button variant="ghost" onPress={() => setEditing(null)} className="px-2 py-2.5">
                      ✕
                    </Button>
                  </View>
                ) : goal ? (
                  <View className="gap-2">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-600">
                        {current} / {goal.target} {unit}
                      </Text>
                      <Text className={`text-sm font-semibold ${pct >= 1 ? 'text-green-600' : 'text-blue-600'}`}>
                        {Math.round(pct * 100)}%
                      </Text>
                    </View>
                    <View className="h-2.5 rounded-full bg-slate-100">
                      <View
                        className={`h-2.5 rounded-full ${pct >= 1 ? 'bg-green-500' : 'bg-blue-600'}`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => startEdit(type)}
                    className="flex-row items-center gap-2 py-1"
                  >
                    <Plus size={15} color="#2563eb" />
                    <Text className="text-sm font-medium text-blue-600">Set a goal</Text>
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
