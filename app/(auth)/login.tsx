import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View,
} from 'react-native';
import { AuthActions } from '../../lib/auth';
import { useAuth } from '../../lib/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginScreen() {
  const { refreshUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter email and password.');
      return;
    }
    if (isSignUp && !name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await AuthActions.signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await AuthActions.loginWithEmail(email.trim(), password);
      }
      await refreshUser();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Error', msg.replace('Firebase: ', ''));
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
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 mb-4">
              <Text className="text-4xl">✝️</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-800">YEF Evangelism</Text>
            <Text className="mt-1 text-sm text-slate-500">
              {isSignUp ? 'Create your account' : 'Sign in to continue'}
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

            <Button onPress={submit} loading={loading} fullWidth className="mt-2">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <Button variant="ghost" onPress={() => setIsSignUp((v) => !v)} disabled={loading} fullWidth>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
