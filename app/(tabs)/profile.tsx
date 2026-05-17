import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  BarChart2, Target, BookText, Users, Shield, LogOut,
  ChevronRight, Clock, TrendingUp, BookOpen,
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { Entities } from '../../lib/firestore';
import { Card, CardContent } from '../../components/ui/Card';
import type { EvangelismSession, Student } from '../../lib/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const { data: sessions = [] } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions-all'],
    queryFn: () => Entities.EvangelismSession.list('-created_date', 500) as Promise<EvangelismSession[]>,
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students-all'],
    queryFn: () => Entities.Student.list('-created_date', 500) as Promise<Student[]>,
  });

  const mySessions = sessions.filter((s) => s.userId === user?.id);
  const myStudents = students.filter((s) => s.evangelizedByUserId === user?.id);
  const myHours = Math.round(
    mySessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0) / 60 * 10
  ) / 10;
  const bibleStudies = myStudents.filter((s) => s.bibleStudyTopics?.some((t) => t.completed)).length;

  const stats = [
    { label: 'Hours', value: myHours, icon: Clock },
    { label: 'Sessions', value: mySessions.length, icon: TrendingUp },
    { label: 'Students', value: myStudents.length, icon: Users },
    { label: 'Bible Studies', value: bibleStudies, icon: BookOpen },
  ];

  const menuItems = [
    { icon: BarChart2, label: 'Analytics', route: '/analytics', color: '#4f46e5' },
    { icon: Target, label: 'Goals', route: '/goals', color: '#16a34a' },
    { icon: BookText, label: 'Session Logs', route: '/session-logs', color: '#0891b2' },
    { icon: Users, label: 'Members', route: '/members', color: '#7c3aed' },
    ...(user?.userRole === 'Admin'
      ? [{ icon: Shield, label: 'Manage Roles', route: '/manage-roles', color: '#dc2626' }]
      : []),
  ];

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-blue-600 pt-14 pb-8 px-5 items-center">
        {user?.profilePhoto ? (
          <Image
            source={{ uri: user.profilePhoto }}
            className="w-20 h-20 rounded-full border-2 border-white mb-3"
          />
        ) : (
          <View className="w-20 h-20 rounded-full bg-blue-500 items-center justify-center border-2 border-white mb-3">
            <Text className="text-white text-2xl font-bold">
              {(user?.full_name ?? user?.name ?? '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text className="text-white text-xl font-bold">{user?.full_name ?? user?.name}</Text>
        <Text className="text-blue-200 text-sm mt-0.5">{user?.userRole} · {user?.chapterName}</Text>
        {user?.bio && (
          <Text className="text-blue-100 text-xs mt-2 text-center max-w-xs">{user.bio}</Text>
        )}
        <TouchableOpacity
          onPress={() => router.push('/edit-profile')}
          className="mt-3 px-4 py-1.5 bg-blue-500 rounded-full"
        >
          <Text className="text-white text-xs font-semibold">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 -mt-4">
        {/* Stats */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <View className="flex-row justify-around">
              {stats.map(({ label, value, icon: Icon }) => (
                <View key={label} className="items-center">
                  <Text className="text-2xl font-bold text-slate-800">{value}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">{label}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Menu */}
        <Card className="mb-4">
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as any)}
              className={`flex-row items-center px-4 py-4 gap-3 ${
                idx < menuItems.length - 1 ? 'border-b border-slate-100' : ''
              }`}
              activeOpacity={0.7}
            >
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon size={18} color={item.color} />
              </View>
              <Text className="flex-1 text-sm font-medium text-slate-700">{item.label}</Text>
              <ChevronRight size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center gap-3 p-4 mb-8"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
