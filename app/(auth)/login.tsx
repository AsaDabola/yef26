import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Auth } from '../../lib/firestore';
import { useAuth } from '../../lib/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    if (isSignUp && !name.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await Auth.signUpWithEmail(email.trim(), password, { name: name.trim() });
      } else {
        await Auth.loginWithEmail(email.trim(), password);
      }
      await refreshUser();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
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
        <View className="flex-1 justify-center px-6 py-12">
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
              <Text className="text-3xl">✝️</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-800">YEF Evangelism</Text>
            <Text className="text-sm text-slate-500 mt-1">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </Text>
          </View>

          <View className="gap-4">
            {isSignUp && (
              <Input
                label="Full Name"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button onPress={handleSubmit} loading={loading} className="mt-2">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <Button
              variant="ghost"
              onPress={() => setIsSignUp((v) => !v)}
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
