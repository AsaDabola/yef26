import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, Newspaper, UserPlus, Users } from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { StudentDB, SessionDB } from '../../lib/db';
import { useSessionStore } from '../../lib/store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { SessionMode } from '../../lib/types';

// ── Live timer ──────────────────────────────────────────────────────────────
function useElapsed(startTime: string | null) {
  const [elapsed, setElapsed] = useState('0:00');
  useEffect(() => {
    if (!startTime) return;
    const tick = () => {
      const s = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsed(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return elapsed;
}

// ── Add-student form (shared by both "live" and "standalone" modes) ─────────
function AddStudentModal({
  visible, onClose, onSaved,
}: { visible: boolean; onClose: () => void; onSaved?: (id: string) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [uni, setUni] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      StudentDB.create({
        name: name.trim(),
        universityName: uni.trim(),
        phone: phone.trim(),
        email: email.trim(),
        country: user?.country ?? '',
        statusPipeline: 'Evangelized',
        evangelizedByUserId: user?.id,
        evangelizedByUserName: user?.full_name ?? user?.name ?? '',
        evangelizedByChapterId: user?.chapterId ?? '',
        evangelizedByChapterName: user?.chapterName ?? '',
        bibleStudyTopics: [],
      }) as Promise<{ id: string }>,
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      onSaved?.(s.id);
      setName(''); setUni(''); setPhone(''); setEmail('');
      onClose();
      Alert.alert('Saved!', 'Student added successfully.');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  function save() {
    if (!name.trim() || !uni.trim()) {
      Alert.alert('Required', 'Name and university are required');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="border-b border-slate-100 px-5 pb-4 pt-6">
          <Text className="text-lg font-bold text-slate-800">Add Student</Text>
        </View>
        <ScrollView className="flex-1 px-5 py-4" keyboardShouldPersistTaps="handled">
          <View className="gap-4">
            <Input label="Full Name *" placeholder="Student's name" value={name} onChangeText={setName} />
            <Input label="University *" placeholder="University name" value={uni} onChangeText={setUni} />
            <Input label="Phone" placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Email" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <View className="mt-2 flex-row gap-3">
              <Button variant="outline" onPress={onClose} className="flex-1">Cancel</Button>
              <Button onPress={save} loading={mutation.isPending} className="flex-1">Save</Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function AddScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isEvangelizing, session, start, stop, addStudent } = useSessionStore();
  const elapsed = useElapsed(isEvangelizing ? session?.startTime ?? null : null);

  const [showStart, setShowStart] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [mode, setMode] = useState<SessionMode>('Individual');
  const [location, setLocation] = useState('');

  const endMutation = useMutation({
    mutationFn: async () => {
      const s = stop();
      await SessionDB.create({
        ...s,
        userId: user?.id,
        userName: user?.full_name ?? user?.name ?? '',
        chapterId: user?.chapterId ?? '',
        chapterName: user?.chapterName ?? '',
        country: user?.country ?? '',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      Alert.alert('Session Saved!', 'Your evangelism session has been recorded.');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  function confirmEnd() {
    Alert.alert('End Session', 'End and save this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Session', style: 'destructive', onPress: () => endMutation.mutate() },
    ]);
  }

  // ── Live session view ──────────────────────────────────────────────────────
  if (isEvangelizing && session) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="bg-red-500 px-5 pb-6 pt-14">
          <View className="mb-1 flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-white" />
            <Text className="text-sm font-semibold text-white">LIVE SESSION</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Clock size={22} color="#fff" />
            <Text className="text-4xl font-bold text-white">{elapsed}</Text>
          </View>
          {session.locationName ? (
            <View className="mt-1 flex-row items-center gap-1">
              <MapPin size={13} color="#fecaca" />
              <Text className="text-xs text-red-200">{session.locationName}</Text>
            </View>
          ) : null}
          <View className="mt-1 flex-row items-center gap-1">
            <Users size={13} color="#fecaca" />
            <Text className="text-xs text-red-200">{session.studentIds.length} students added</Text>
          </View>
        </View>

        <View className="px-4 pt-4 gap-3">
          <TouchableOpacity
            onPress={() => setShowAddStudent(true)}
            className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
              <UserPlus size={22} color="#16a34a" />
            </View>
            <View>
              <Text className="text-base font-bold text-slate-800">Add Student</Text>
              <Text className="text-xs text-slate-500">Log someone you evangelized</Text>
            </View>
          </TouchableOpacity>

          <Button variant="destructive" onPress={confirmEnd} loading={endMutation.isPending} fullWidth>
            End Session
          </Button>
        </View>

        <AddStudentModal
          visible={showAddStudent}
          onClose={() => setShowAddStudent(false)}
          onSaved={addStudent}
        />
      </View>
    );
  }

  // ── Idle view ──────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-slate-50">
      <View className="border-b border-slate-200 bg-white px-5 pb-4 pt-14">
        <Text className="text-xl font-bold text-slate-800">Quick Actions</Text>
      </View>

      <View className="px-4 pt-4 gap-3">
        <TouchableOpacity
          onPress={() => setShowStart(true)}
          className="flex-row items-center gap-4 rounded-2xl bg-blue-600 p-5"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-500">
            <Clock size={22} color="#fff" />
          </View>
          <View>
            <Text className="text-base font-bold text-white">Start Evangelizing</Text>
            <Text className="text-xs text-blue-200">Start a timed session</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowAddStudent(true)}
          className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
            <UserPlus size={22} color="#16a34a" />
          </View>
          <View>
            <Text className="text-base font-bold text-slate-800">Add Student</Text>
            <Text className="text-xs text-slate-500">Log a contact without a session</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/news')}
          className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
            <Newspaper size={22} color="#7c3aed" />
          </View>
          <View>
            <Text className="text-base font-bold text-slate-800">Post News</Text>
            <Text className="text-xs text-slate-500">Share with your chapter or globally</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Start session modal */}
      <Modal visible={showStart} transparent animationType="slide">
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="rounded-t-3xl bg-white px-5 pb-10 pt-6">
            <Text className="mb-4 text-lg font-bold text-slate-800">Start Session</Text>
            <View className="gap-4">
              <Select
                label="Session Type"
                value={mode}
                onValueChange={(v) => setMode(v as SessionMode)}
                options={[
                  { label: 'Individual', value: 'Individual' },
                  { label: 'Group', value: 'Group' },
                ]}
              />
              <Input
                label="Location (optional)"
                placeholder="e.g. Campus Library"
                value={location}
                onChangeText={setLocation}
              />
              <View className="flex-row gap-3">
                <Button variant="outline" onPress={() => setShowStart(false)} className="flex-1">Cancel</Button>
                <Button
                  onPress={() => { start({ modeType: mode, locationName: location }); setShowStart(false); }}
                  className="flex-1"
                >
                  Start
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AddStudentModal
        visible={showAddStudent}
        onClose={() => setShowAddStudent(false)}
      />
    </View>
  );
}
