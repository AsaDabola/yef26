import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Play, Square, UserPlus, Newspaper, MapPin, Users, X, Loader2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Entities } from '@/lib/firestore';
import { useEvangelizing } from '@/hooks/useEvangelizing';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function AddScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isEvangelizing, sessionData, startEvangelizing, stopEvangelizing, addStudentToSession } = useEvangelizing();

  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const [sessionForm, setSessionForm] = useState({ modeType: 'Individual', locationName: '' });
  const [studentForm, setStudentForm] = useState({ name: '', universityName: '', phone: '', email: '' });
  const [newsForm, setNewsForm] = useState({ title: '', content: '', isGlobal: false });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isEvangelizing && sessionData?.startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(sessionData.startTime).getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isEvangelizing, sessionData?.startTime]);

  const handleStart = () => {
    startEvangelizing({ modeType: sessionForm.modeType, locationName: sessionForm.locationName });
  };

  const handleStop = async () => {
    setSaving(true);
    const result = stopEvangelizing();
    try {
      await Entities.EvangelismSession.create({
        ...result,
        userId: user?.id,
        userName: user?.full_name,
        chapterId: user?.chapterId,
        chapterName: user?.chapterName,
        country: user?.country,
      });
      router.push('/(tabs)/profile');
    } catch {
      Alert.alert('Error', 'Could not save session.');
    }
    setSaving(false);
  };

  const handleAddStudent = async () => {
    if (!studentForm.name) return;
    setSaving(true);
    try {
      const s = await Entities.Student.create({
        ...studentForm,
        evangelizedByUserId: user?.id,
        evangelizedByUserName: user?.full_name,
        evangelizedByChapterId: user?.chapterId,
        evangelizedByChapterName: user?.chapterName,
        country: user?.country,
        statusPipeline: 'Evangelized',
      });
      if (isEvangelizing) addStudentToSession(s.id as string);
      setStudentForm({ name: '', universityName: '', phone: '', email: '' });
      setShowStudentModal(false);
      Alert.alert('Added!', `${studentForm.name} has been added.`);
    } catch {
      Alert.alert('Error', 'Could not add student.');
    }
    setSaving(false);
  };

  const handleCreateNews = async () => {
    if (!newsForm.title || !newsForm.content) return;
    setSaving(true);
    try {
      await Entities.NewsPost.create({
        ...newsForm,
        chapterId: newsForm.isGlobal ? null : user?.chapterId,
        country: user?.country,
        authorId: user?.id,
        authorName: user?.full_name,
      });
      setNewsForm({ title: '', content: '', isGlobal: false });
      Alert.alert('Published!', 'News post created.');
      router.push('/(tabs)/news');
    } catch {
      Alert.alert('Error', 'Could not publish post.');
    }
    setSaving(false);
  };

  const canCreateNews = user?.userRole === 'Admin' || user?.userRole === 'Evangelism Leader';

  return (
    <View className="flex-1 bg-slate-50">
      {/* Evangelizing Banner */}
      {isEvangelizing && (
        <View className="bg-blue-600 px-4 py-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <Text className="text-white font-medium text-sm">Evangelizing Mode Active</Text>
          </View>
          <Text className="text-blue-200 text-sm">{sessionData?.modeType}</Text>
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingTop: isEvangelizing ? 8 : 48 }}>
        <Text className="text-2xl font-bold text-slate-800 mb-1">
          {isEvangelizing ? 'Evangelizing Mode' : 'Quick Actions'}
        </Text>
        <Text className="text-sm text-slate-500 mb-6">
          {isEvangelizing ? 'Session in progress' : 'Start a session or add records'}
        </Text>

        {/* Active Session Card */}
        {isEvangelizing && (
          <View className="bg-blue-600 rounded-2xl p-6 mb-5">
            <Text className="text-blue-200 text-sm text-center mb-2">Time Evangelizing</Text>
            <Text className="text-5xl font-bold text-white text-center font-mono tracking-wider">
              {formatTime(elapsed)}
            </Text>
            <View className="flex-row justify-center gap-4 mt-4 mb-5">
              <View className="flex-row items-center gap-1">
                <Users size={14} color="#bfdbfe" />
                <Text className="text-blue-200 text-xs">{sessionData?.modeType}</Text>
              </View>
              {sessionData?.locationName ? (
                <View className="flex-row items-center gap-1">
                  <MapPin size={14} color="#bfdbfe" />
                  <Text className="text-blue-200 text-xs">{sessionData.locationName}</Text>
                </View>
              ) : null}
              <Text className="text-blue-200 text-xs">
                {sessionData?.studentIds?.length ?? 0} students
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowStudentModal(true)}
              className="bg-white/20 rounded-xl py-3 items-center mb-3"
            >
              <View className="flex-row items-center gap-2">
                <UserPlus size={16} color="#fff" />
                <Text className="text-white font-medium">Add Student</Text>
              </View>
            </TouchableOpacity>
            <Button variant="destructive" onPress={handleStop} loading={saving}>
              <View className="flex-row items-center gap-2">
                <Square size={16} color="#fff" />
                <Text className="text-white font-semibold">End Session</Text>
              </View>
            </Button>
          </View>
        )}

        {/* Start Session */}
        {!isEvangelizing && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>
                <View className="flex-row items-center gap-2">
                  <Play size={18} color="#2563eb" />
                  <Text className="text-base font-semibold text-slate-800">Start Evangelizing</Text>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                <Select
                  label="Session Type"
                  value={sessionForm.modeType}
                  onValueChange={(v) => setSessionForm({ ...sessionForm, modeType: v })}
                  options={[{ label: 'Individual', value: 'Individual' }, { label: 'Group', value: 'Group' }]}
                />
                <Input
                  label="Location (optional)"
                  value={sessionForm.locationName}
                  onChangeText={(v) => setSessionForm({ ...sessionForm, locationName: v })}
                  placeholder="e.g., Campus Library"
                />
                <Button onPress={handleStart}>
                  <View className="flex-row items-center gap-2">
                    <Play size={16} color="#fff" />
                    <Text className="text-white font-semibold">Start Session</Text>
                  </View>
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Quick Add Student */}
        {!isEvangelizing && (
          <TouchableOpacity onPress={() => setShowStudentModal(true)}>
            <Card className="mb-4 p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center">
                  <UserPlus size={20} color="#16a34a" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-slate-800">Add New Student</Text>
                  <Text className="text-xs text-slate-500">Record a student contact</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Create News */}
        {canCreateNews && !isEvangelizing && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>
                <View className="flex-row items-center gap-2">
                  <Newspaper size={18} color="#4f46e5" />
                  <Text className="text-base font-semibold text-slate-800">Create News Post</Text>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                <Input label="Title *" value={newsForm.title}
                  onChangeText={(v) => setNewsForm({ ...newsForm, title: v })} placeholder="Post title" />
                <Input label="Content *" value={newsForm.content}
                  onChangeText={(v) => setNewsForm({ ...newsForm, content: v })}
                  placeholder="Write your update..." multiline numberOfLines={4}
                  textAlignVertical="top" className="min-h-24" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-slate-700">Post Globally</Text>
                  <TouchableOpacity
                    onPress={() => setNewsForm({ ...newsForm, isGlobal: !newsForm.isGlobal })}
                    className={`w-12 h-6 rounded-full ${newsForm.isGlobal ? 'bg-blue-600' : 'bg-slate-200'} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white shadow mx-0.5 ${newsForm.isGlobal ? 'ml-6' : ''}`} />
                  </TouchableOpacity>
                </View>
                <Button
                  onPress={handleCreateNews}
                  disabled={!newsForm.title || !newsForm.content}
                  loading={saving}
                >
                  Publish Post
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
      </ScrollView>

      {/* Add Student Modal */}
      <Modal visible={showStudentModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-slate-800">Quick Add Student</Text>
                <TouchableOpacity onPress={() => setShowStudentModal(false)}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
                <Input label="Name *" value={studentForm.name}
                  onChangeText={(v) => setStudentForm({ ...studentForm, name: v })} placeholder="Student's name" />
                <Input label="University" value={studentForm.universityName}
                  onChangeText={(v) => setStudentForm({ ...studentForm, universityName: v })} placeholder="e.g., UCLA" />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input label="Phone" value={studentForm.phone}
                      onChangeText={(v) => setStudentForm({ ...studentForm, phone: v })}
                      placeholder="Phone" keyboardType="phone-pad" />
                  </View>
                  <View className="flex-1">
                    <Input label="Email" value={studentForm.email}
                      onChangeText={(v) => setStudentForm({ ...studentForm, email: v })}
                      placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </View>
                <Button onPress={handleAddStudent} disabled={!studentForm.name} loading={saving}>
                  Add Student
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
