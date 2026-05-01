import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Users, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { Auth, Entities } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Nigeria',
  'Ghana', 'South Korea', 'Germany', 'France', 'Brazil', 'Other',
].map((c) => ({ label: c, value: c }));

export default function Onboarding() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<{ label: string; value: string }[]>([]);
  const [form, setForm] = useState({
    country: '', state: '', city: '',
    chapterId: '', chapterName: '', newChapterName: '',
  });

  useEffect(() => {
    if (!form.country) return;
    Entities.Chapter.filter({ country: form.country }).then((chaps) => {
      setChapters([
        ...chaps.map((c: Record<string, unknown>) => ({ label: c.name as string, value: c.id as string })),
        { label: '+ Create New Chapter', value: 'new' },
      ]);
    });
  }, [form.country]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let chapterId = form.chapterId;
      let chapterName = form.chapterName;

      if (form.chapterId === 'new' && form.newChapterName) {
        const c = await Entities.Chapter.create({
          name: form.newChapterName,
          country: form.country,
          state: form.state,
          city: form.city,
        });
        chapterId = c.id as string;
        chapterName = form.newChapterName;
      }

      await Auth.updateMe({
        country: form.country, state: form.state, city: form.city,
        chapterId, chapterName,
        onboardingComplete: true,
        userRole: 'Member',
        membershipStatus: 'Active',
      });

      await refreshUser();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Could not complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-navy"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-3">
              <Text className="text-white text-2xl font-bold">YEF</Text>
            </View>
            <Text className="text-2xl font-bold text-white">Welcome to YEF Tracker</Text>
            <Text className="text-sm text-blue-200 mt-1">Let's get you set up in just a moment</Text>
          </View>

          {/* Step 1 — Location */}
          {step === 1 && (
            <View className="bg-white rounded-3xl p-6 space-y-4">
              <View className="flex-row items-center gap-3 mb-2">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                  <MapPin size={20} color="#2563eb" />
                </View>
                <View>
                  <Text className="font-semibold text-slate-800">Your Location</Text>
                  <Text className="text-xs text-slate-500">Where are you based?</Text>
                </View>
              </View>

              <Select
                label="Country *"
                value={form.country}
                onValueChange={(v) => setForm({ ...form, country: v, chapterId: '', chapterName: '' })}
                options={COUNTRIES}
                placeholder="Select country"
              />
              <Input label="State / Province" value={form.state}
                onChangeText={(v) => setForm({ ...form, state: v })} placeholder="e.g., California" />
              <Input label="City" value={form.city}
                onChangeText={(v) => setForm({ ...form, city: v })} placeholder="e.g., Los Angeles" />

              <Button onPress={() => setStep(2)} disabled={!form.country}>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-semibold">Continue</Text>
                  <ArrowRight size={16} color="#fff" />
                </View>
              </Button>
            </View>
          )}

          {/* Step 2 — Chapter */}
          {step === 2 && (
            <View className="bg-white rounded-3xl p-6 space-y-4">
              <View className="flex-row items-center gap-3 mb-2">
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <Users size={20} color="#4f46e5" />
                </View>
                <View>
                  <Text className="font-semibold text-slate-800">Your Chapter</Text>
                  <Text className="text-xs text-slate-500">Join or create a local chapter</Text>
                </View>
              </View>

              <Select
                label="Select Chapter"
                value={form.chapterId}
                onValueChange={(v) => {
                  const found = chapters.find((c) => c.value === v);
                  setForm({ ...form, chapterId: v, chapterName: found?.label ?? '' });
                }}
                options={chapters}
                placeholder="Choose your chapter"
              />

              {form.chapterId === 'new' && (
                <Input label="New Chapter Name" value={form.newChapterName}
                  onChangeText={(v) => setForm({ ...form, newChapterName: v })}
                  placeholder="e.g., YEF Los Angeles" />
              )}

              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity onPress={() => setStep(1)}
                  className="flex-1 border border-slate-200 rounded-xl py-3 items-center">
                  <View className="flex-row items-center gap-1">
                    <ArrowLeft size={16} color="#64748b" />
                    <Text className="text-sm font-medium text-slate-600">Back</Text>
                  </View>
                </TouchableOpacity>
                <Button
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={!form.chapterId || (form.chapterId === 'new' && !form.newChapterName)}
                  className="flex-1"
                >
                  Get Started
                </Button>
              </View>
            </View>
          )}

          {/* Dots */}
          <View className="flex-row justify-center gap-2 mt-6">
            <View className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-white' : 'bg-white/30'}`} />
            <View className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-white' : 'bg-white/30'}`} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
