import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Auth, uploadFile } from '@/lib/firestore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Auth.updateMe({ bio });
      await refreshUser();
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save profile.');
    }
    setSaving(false);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        const url = await uploadFile({ uri: result.assets[0].uri, name: 'profile.jpg' });
        await Auth.updateMe({ profilePhoto: url });
        await refreshUser();
      } catch {
        Alert.alert('Error', 'Could not upload photo.');
      }
      setUploadingPhoto(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-4 pt-12 pb-8">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={22} color="#1e293b" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-slate-800">Edit Profile</Text>
            </View>
            <Button onPress={handleSave} loading={saving} className="px-4 py-2">Save</Button>
          </View>

          {/* Photo */}
          <Card className="mb-5 p-5 items-center">
            <TouchableOpacity onPress={handlePickPhoto} className="relative">
              <View className="w-24 h-24 rounded-2xl bg-blue-600 items-center justify-center shadow-md">
                {uploadingPhoto ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-4xl font-bold">
                    {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                )}
              </View>
              <View className="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 rounded-full items-center justify-center shadow">
                <Camera size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text className="text-xs text-slate-400 mt-4">Tap to change photo</Text>
          </Card>

          {/* Read-only fields */}
          <Card className="mb-4">
            <CardContent>
              <View className="gap-3 pt-4">
                {[
                  { label: 'Name', value: user?.full_name },
                  { label: 'Email', value: user?.email },
                  { label: 'Chapter', value: user?.chapterName },
                  { label: 'Country', value: user?.country },
                ].map((f) => (
                  <View key={f.label} className="flex-row items-center gap-3">
                    <Text className="text-xs font-medium text-slate-400 w-16">{f.label}</Text>
                    <Text className="text-sm text-slate-700 flex-1">{f.value ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Editable */}
          <Card className="mb-4">
            <CardContent>
              <View className="pt-4">
                <Input
                  label="Bio"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell your chapter about yourself..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="min-h-24"
                />
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
