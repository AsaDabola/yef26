import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, UserPlus, Newspaper, Clock, MapPin, Users } from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { Entities } from '../../lib/firestore';
import { useEvangelizing } from '../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

function useTimer(startTime: string | null) {
  const [elapsed, setElapsed] = useState('0:00');
  useEffect(() => {
    if (!startTime) return;
    const tick = () => {
      const secs = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return elapsed;
}

export default function AddScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isEvangelizing, sessionData, startEvangelizing, stopEvangelizing } = useEvangelizing();
  const elapsed = useTimer(isEvangelizing ? sessionData?.startTime ?? null : null);

  const [showStartModal, setShowStartModal] = useState(false);
  const [modeType, setModeType] = useState<'Individual' | 'Group'>('Individual');
  const [locationName, setLocationName] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Add Student form
  const [studentName, setStudentName] = useState('');
  const [university, setUniversity] = useState('');
  const [phone, setPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  const endMutation = useMutation({
    mutationFn: async () => {
      const session = stopEvangelizing();
      await Entities.EvangelismSession.create({
        ...session,
        userId: user?.id,
        userName: user?.full_name ?? user?.name ?? '',
        chapterId: user?.chapterId ?? '',
        chapterName: user?.chapterName ?? '',
        country: user?.country ?? '',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions-all'] });
      Alert.alert('Session Saved', 'Your evangelism session has been recorded!');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      const s = await Entities.Student.create({
        name: studentName.trim(),
        universityName: university.trim(),
        phone: phone.trim(),
        email: studentEmail.trim(),
        country: user?.country ?? '',
        statusPipeline: 'Evangelized',
        evangelizedByUserId: user?.id,
        evangelizedByUserName: user?.full_name ?? user?.name ?? '',
        evangelizedByChapterId: user?.chapterId ?? '',
        evangelizedByChapterName: user?.chapterName ?? '',
        bibleStudyTopics: [],
      }) as { id: string };
      if (isEvangelizing) useEvangelizing.getState().addStudentToSession(s.id);
      return s;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students-all'] });
      setStudentName(''); setUniversity(''); setPhone(''); setStudentEmail('');
      setShowAddStudent(false);
      Alert.alert('Student Added!', 'Student saved successfully.');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  function handleStart() {
    startEvangelizing({ modeType, locationName });
    setShowStartModal(false);
  }

  function handleEnd() {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => endMutation.mutate() },
    ]);
  }

  if (isEvangelizing) {
    return (
      <ScrollView className="flex-1 bg-slate-50">
        <View className="bg-red-500 pt-14 pb-6 px-5">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-2 h-2 bg-white rounded-full" />
            <Text className="text-white text-sm font-semibold">LIVE SESSION</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Clock size={22} color="#fff" />
            <Text className="text-white text-4xl font-bold">{elapsed}</Text>
          </View>
          {sessionData?.locationName ? (
            <View className="flex-row items-center gap-1 mt-2">
              <MapPin size={13} color="#fecaca" />
              <Text className="text-red-200 text-xs">{sessionData.locationName}</Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-1 mt-1">
            <Users size={13} color="#fecaca" />
            <Text className="text-red-200 text-xs">
              {sessionData?.studentIds.length ?? 0} students added
            </Text>
          </View>
        </View>

        <View className="px-4 pt-4 gap-3">
          <TouchableOpacity
            onPress={() => setShowAddStudent(true)}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center gap-3"
          >
            <View className="w-10 h-10 bg-green-50 rounded-xl items-center justify-center">
              <UserPlus size={20} color="#16a34a" />
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-800">Add Student</Text>
              <Text className="text-xs text-slate-500">Log someone you evangelized</Text>
            </View>
          </TouchableOpacity>

          <Button
            variant="destructive"
            onPress={handleEnd}
            loading={endMutation.isPending}
          >
            End Session
          </Button>
        </View>

        {/* Add Student Modal */}
        <Modal visible={showAddStudent} animationType="slide" presentationStyle="pageSheet">
          <KeyboardAvoidingView
            className="flex-1 bg-white"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="px-5 pt-6 pb-4 border-b border-slate-100">
              <Text className="text-lg font-bold text-slate-800">Add Student</Text>
            </View>
            <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
              <View className="gap-4">
                <Input label="Full Name *" placeholder="Student's name" value={studentName} onChangeText={setStudentName} />
                <Input label="University *" placeholder="University name" value={university} onChangeText={setUniversity} />
                <Input label="Phone" placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Input label="Email" placeholder="Email address" value={studentEmail} onChangeText={setStudentEmail} keyboardType="email-address" autoCapitalize="none" />
                <View className="flex-row gap-3 mt-2">
                  <Button variant="outline" onPress={() => setShowAddStudent(false)} className="flex-1">Cancel</Button>
                  <Button
                    onPress={() => {
                      if (!studentName.trim() || !university.trim()) {
                        Alert.alert('Required', 'Name and university are required');
                        return;
                      }
                      addStudentMutation.mutate();
                    }}
                    loading={addStudentMutation.isPending}
                    className="flex-1"
                  >
                    Save
                  </Button>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="bg-white border-b border-slate-200 pt-14 pb-4 px-5">
        <Text className="text-xl font-bold text-slate-800">Quick Actions</Text>
      </View>

      <View className="px-4 pt-4 gap-3">
        <TouchableOpacity
          onPress={() => setShowStartModal(true)}
          className="bg-blue-600 rounded-2xl p-5 flex-row items-center gap-4"
        >
          <View className="w-12 h-12 bg-blue-500 rounded-2xl items-center justify-center">
            <Play size={22} color="#fff" />
          </View>
          <View>
            <Text className="text-white font-bold text-base">Start Evangelizing</Text>
            <Text className="text-blue-200 text-xs mt-0.5">Start a timed session</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowAddStudent(true)}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex-row items-center gap-4"
        >
          <View className="w-12 h-12 bg-green-50 rounded-2xl items-center justify-center">
            <UserPlus size={22} color="#16a34a" />
          </View>
          <View>
            <Text className="text-slate-800 font-bold text-base">Add Student</Text>
            <Text className="text-slate-500 text-xs mt-0.5">Log a contact without a session</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/news')}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex-row items-center gap-4"
        >
          <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center">
            <Newspaper size={22} color="#7c3aed" />
          </View>
          <View>
            <Text className="text-slate-800 font-bold text-base">Post News</Text>
            <Text className="text-slate-500 text-xs mt-0.5">Share with your chapter or globally</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Start Session Modal */}
      <Modal visible={showStartModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl px-5 pt-6 pb-10 gap-4">
              <Text className="text-lg font-bold text-slate-800">Start Evangelism Session</Text>
              <Select
                label="Session Type"
                value={modeType}
                onValueChange={(v) => setModeType(v as 'Individual' | 'Group')}
                options={[
                  { label: 'Individual', value: 'Individual' },
                  { label: 'Group', value: 'Group' },
                ]}
              />
              <Input
                label="Location (optional)"
                placeholder="e.g. Campus Library"
                value={locationName}
                onChangeText={setLocationName}
              />
              <View className="flex-row gap-3">
                <Button variant="outline" onPress={() => setShowStartModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onPress={handleStart} className="flex-1">
                  Start
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Student Modal (outside session) */}
      <Modal visible={showAddStudent && !isEvangelizing} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="px-5 pt-6 pb-4 border-b border-slate-100">
            <Text className="text-lg font-bold text-slate-800">Add Student</Text>
          </View>
          <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              <Input label="Full Name *" placeholder="Student's name" value={studentName} onChangeText={setStudentName} />
              <Input label="University *" placeholder="University name" value={university} onChangeText={setUniversity} />
              <Input label="Phone" placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Input label="Email" placeholder="Email address" value={studentEmail} onChangeText={setStudentEmail} keyboardType="email-address" autoCapitalize="none" />
              <View className="flex-row gap-3 mt-2">
                <Button variant="outline" onPress={() => setShowAddStudent(false)} className="flex-1">Cancel</Button>
                <Button
                  onPress={() => {
                    if (!studentName.trim() || !university.trim()) {
                      Alert.alert('Required', 'Name and university are required');
                      return;
                    }
                    addStudentMutation.mutate();
                  }}
                  loading={addStudentMutation.isPending}
                  className="flex-1"
                >
                  Save
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
