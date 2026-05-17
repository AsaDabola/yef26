import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AuthActions, useAuth } from '../../lib/auth';
import { ChapterDB } from '../../lib/db';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { Chapter } from '../../lib/types';

const COUNTRIES = [
  'USA','Canada','UK','Nigeria','Ghana','Kenya','South Korea',
  'Philippines','India','Australia','Germany','France','Brazil','Other',
].map((c) => ({ label: c, value: c }));

export default function OnboardingScreen() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [newChapter, setNewChapter] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ['chapters'],
    queryFn: () => ChapterDB.list() as Promise<Chapter[]>,
  });

  const chapterOptions = [
    ...chapters
      .filter((c) => !country || c.country === country)
      .map((c) => ({ label: c.name, value: c.id })),
    { label: '+ Create new chapter', value: '__new__' },
  ];

  async function finish() {
    if (!chapterId) { Alert.alert('Required', 'Please select or create a chapter'); return; }
    if (chapterId === '__new__' && !newChapter.trim()) {
      Alert.alert('Required', 'Enter a chapter name');
      return;
    }
    setLoading(true);
    try {
      let finalId = chapterId;
      let finalName = '';
      if (chapterId === '__new__') {
        const ch = await ChapterDB.create({ name: newChapter.trim(), country, state, city }) as Chapter;
        finalId = ch.id;
        finalName = ch.name;
      } else {
        finalName = chapters.find((c) => c.id === chapterId)?.name ?? '';
      }
      await AuthActions.updateProfile(user!.id, {
        country, state, city,
        chapterId: finalId,
        chapterName: finalName,
        onboardingComplete: true,
        membershipStatus: 'Active',
        userRole: 'Member',
      });
      await refreshUser();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-12">
          <Text className="text-2xl font-bold text-slate-800">Welcome!</Text>
          <Text className="mt-1 text-sm text-slate-500">Step {step} of 2</Text>

          {/* Progress bar */}
          <View className="mt-3 mb-8 flex-row gap-2">
            {[1, 2].map((s) => (
              <View
                key={s}
                className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`}
              />
            ))}
          </View>

          {step === 1 ? (
            <View className="gap-4">
              <Text className="text-base font-semibold text-slate-700">Where are you located?</Text>
              <Select
                label="Country"
                value={country}
                onValueChange={setCountry}
                options={COUNTRIES}
                placeholder="Select country"
              />
              <Input label="State / Province" placeholder="e.g. California" value={state} onChangeText={setState} />
              <Input label="City" placeholder="e.g. Los Angeles" value={city} onChangeText={setCity} />
              <Button
                onPress={() => {
                  if (!country) { Alert.alert('Required', 'Please select your country'); return; }
                  setStep(2);
                }}
                fullWidth
                className="mt-4"
              >
                Continue
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              <Text className="text-base font-semibold text-slate-700">Which chapter do you belong to?</Text>
              <Select
                label="Chapter"
                value={chapterId}
                onValueChange={setChapterId}
                options={chapterOptions}
                placeholder="Select a chapter"
              />
              {chapterId === '__new__' && (
                <Input
                  label="New Chapter Name"
                  placeholder="e.g. UCLA YEF"
                  value={newChapter}
                  onChangeText={setNewChapter}
                />
              )}
              <View className="mt-4 flex-row gap-3">
                <Button variant="outline" onPress={() => setStep(1)} className="flex-1">Back</Button>
                <Button onPress={finish} loading={loading} className="flex-1">Finish</Button>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
