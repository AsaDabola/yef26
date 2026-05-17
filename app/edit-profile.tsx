import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { Auth, uploadFile } from '../lib/firestore';
import { useAuth } from '../lib/auth';
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
      Alert.alert('Permission needed', 'Please allow access to your photos.');
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
        profilePhoto = await uploadFile({ uri: photoUri, name: 'profile.jpg', type: 'image/jpeg' });
      }
      await Auth.updateMe({ full_name: name.trim(), name: name.trim(), bio: bio.trim(), profilePhoto });
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
        <View className="items-center pt-8 pb-4">
          <TouchableOpacity onPress={pickPhoto} className="relative">
            {photoSrc ? (
              <Image source={{ uri: photoSrc }} className="w-24 h-24 rounded-full" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-blue-600 text-3xl font-bold">
                  {(name || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full items-center justify-center border-2 border-white">
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-slate-500 mt-2">Tap to change photo</Text>
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
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />
          <Button onPress={() => mutation.mutate()} loading={mutation.isPending} className="mt-2">
            Save Changes
          </Button>
          <Button variant="outline" onPress={() => router.back()}>
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
