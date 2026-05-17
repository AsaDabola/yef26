import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { AuthActions, useAuth } from '../lib/auth';
import { uploadFile } from '../lib/upload';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.full_name ?? user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      let profilePhoto = user?.profilePhoto;
      if (photoUri) {
        profilePhoto = await uploadFile(photoUri, 'profile.jpg');
      }
      await AuthActions.updateProfile(user!.id, {
        name: name.trim(),
        full_name: name.trim(),
        bio: bio.trim(),
        profilePhoto,
      });
    },
    onSuccess: async () => {
      await refreshUser();
      router.back();
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save'),
  });

  const photoSrc = photoUri ?? user?.profilePhoto;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Avatar picker */}
        <View className="items-center pb-4 pt-8">
          <TouchableOpacity onPress={pickPhoto} className="relative">
            {photoSrc ? (
              <Image source={{ uri: photoSrc }} className="h-24 w-24 rounded-full" />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-100">
                <Text className="text-3xl font-bold text-blue-600">
                  {(name || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600">
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text className="mt-2 text-xs text-slate-500">Tap to change photo</Text>
        </View>

        <View className="px-5 gap-4 pb-8">
          <Input
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Input
            label="Bio (optional)"
            placeholder="Tell us about yourself…"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />
          <Button onPress={() => mutation.mutate()} loading={mutation.isPending} fullWidth className="mt-2">
            Save Changes
          </Button>
          <Button variant="outline" onPress={() => router.back()} fullWidth>
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
