import React, { useState } from 'react';
import {
  View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Auth, Entities } from '../../lib/firestore';
import { useAuth } from '../../lib/auth';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import type { Chapter } from '../../lib/types';

const COUNTRIES = [
  'USA', 'Canada', 'UK', 'Nigeria', 'Ghana', 'Kenya', 'South Korea',
  'Philippines', 'India', 'Australia', 'Germany', 'France', 'Brazil',
  'Other',
].map((c) => ({ label: c, value: c }));

export default function OnboardingScreen() {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [creatingChapter, setCreatingChapter] = useState(false);

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ['chapters'],
    queryFn: () => Entities.Chapter.list() as Promise<Chapter[]>,
  });

  const countryChapters = chapters.filter(
    (c) => !country || c.country === country
  );

  const chapterOptions = [
    ...countryChapters.map((c) => ({ label: c.name, value: c.id })),
    { label: '+ Create new chapter', value: '__new__' },
  ];

  const mutation = useMutation({
    mutationFn: async () => {
      let chapterId = selectedChapterId;
      let chapterName = '';

      if (selectedChapterId === '__new__') {
        if (!newChapterName.trim()) throw new Error('Enter a chapter name');
        const ch = await Entities.Chapter.create({
          name: newChapterName.trim(),
          country,
          state,
          city,
        }) as Chapter;
        chapterId = ch.id;
        chapterName = ch.name;
      } else {
        const ch = chapters.find((c) => c.id === chapterId);
        chapterName = ch?.name ?? '';
      }

      await Auth.updateMe({
        country,
        state,
        city,
        chapterId,
        chapterName,
        onboardingComplete: true,
        membershipStatus: 'Active',
        userRole: 'Member',
      });
    },
    onSuccess: () => refreshUser(),
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  function goNext() {
    if (!country) { Alert.alert('Required', 'Please select your country'); return; }
    setStep(2);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-12">
          <View className="mb-8">
            <Text className="text-2xl font-bold text-slate-800">Welcome!</Text>
            <Text className="text-sm text-slate-500 mt-1">
              Step {step} of 2 — Let's set up your profile
            </Text>
            <View className="flex-row gap-2 mt-3">
              {[1, 2].map((s) => (
                <View
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`}
                />
              ))}
            </View>
          </View>

          {step === 1 ? (
            <View className="gap-4">
              <Text className="text-base font-semibold text-slate-700">Your Location</Text>
              <Select
                label="Country"
                value={country}
                onValueChange={setCountry}
                options={COUNTRIES}
                placeholder="Select country"
              />
              <Input
                label="State / Province (optional)"
                placeholder="e.g. California"
                value={state}
                onChangeText={setState}
              />
              <Input
                label="City (optional)"
                placeholder="e.g. Los Angeles"
                value={city}
                onChangeText={setCity}
              />
              <Button onPress={goNext} className="mt-4">Continue</Button>
            </View>
          ) : (
            <View className="gap-4">
              <Text className="text-base font-semibold text-slate-700">Your Chapter</Text>
              <Select
                label="Select Chapter"
                value={selectedChapterId}
                onValueChange={(v) => {
                  setSelectedChapterId(v);
                  setCreatingChapter(v === '__new__');
                }}
                options={chapterOptions}
                placeholder="Choose a chapter"
              />
              {creatingChapter && (
                <Input
                  label="New Chapter Name"
                  placeholder="e.g. UCLA YEF"
                  value={newChapterName}
                  onChangeText={setNewChapterName}
                />
              )}
              <View className="flex-row gap-3 mt-4">
                <Button variant="outline" onPress={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onPress={() => mutation.mutate()}
                  loading={mutation.isPending}
                  disabled={!selectedChapterId}
                  className="flex-1"
                >
                  Finish
                </Button>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
