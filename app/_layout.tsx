import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '../lib/queryClient';
import { AuthProvider, useAuth } from '../lib/auth';

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (!user.onboardingComplete) {
      router.replace('/(auth)/onboarding');
    } else if (inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="student/[id]" options={{ headerShown: true, title: 'Student' }} />
      <Stack.Screen name="student/[id]/chat" options={{ headerShown: true, title: 'Chat' }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: true, title: 'Edit Profile' }} />
      <Stack.Screen name="analytics" options={{ headerShown: true, title: 'Analytics' }} />
      <Stack.Screen name="goals" options={{ headerShown: true, title: 'Goals' }} />
      <Stack.Screen name="session-logs" options={{ headerShown: true, title: 'Session Logs' }} />
      <Stack.Screen name="members" options={{ headerShown: true, title: 'Members' }} />
      <Stack.Screen name="manage-roles" options={{ headerShown: true, title: 'Manage Roles' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
