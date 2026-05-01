import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Auth } from '@/lib/firestore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please fill in email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        await Auth.signUpWithEmail(email, password, { name });
      } else {
        await Auth.loginWithEmail(email, password);
      }
      // RootNav useEffect will redirect automatically
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error)?.message ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-3xl bg-blue-600 items-center justify-center shadow-lg mb-4">
              <Text className="text-white text-3xl font-bold">YEF</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-800">YEF Evangelism Tracker</Text>
            <Text className="text-sm text-slate-500 mt-1">
              {mode === 'signup' ? 'Create your account' : 'Sign in to continue'}
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
              />
            )}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            <Button onPress={handleSubmit} loading={loading} className="mt-2">
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
          </View>

          {/* Toggle */}
          <TouchableOpacity
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="mt-6 items-center"
          >
            <Text className="text-sm text-slate-600">
              {mode === 'signup' ? (
                <>Already have an account? <Text className="text-blue-600 font-medium">Sign in</Text></>
              ) : (
                <>New here? <Text className="text-blue-600 font-medium">Create an account</Text></>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
