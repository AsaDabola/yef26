import React from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2, BookOpen, BookText, ChevronRight, Clock, LogOut,
  Shield, Target, TrendingUp, Users,
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { SessionDB, StudentDB } from '../../lib/db';
import { Card, CardContent } from '../../components/ui/Card';
import type { EvangelismSession, Student } from '../../lib/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const { data: sessions = [] } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionDB.list('-created_date', 500) as Promise<EvangelismSession[]>,
  });
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => StudentDB.list('-created_date', 500) as Promise<Student[]>,
  });

  const mySessions = sessions.filter((s) => s.userId === user?.id);
  const myStudents = students.filter((s) => s.evangelizedByUserId === user?.id);
  const hours = Math.round(
    mySessions.reduce((a, s) => a + (s.durationMinutes || 0), 0) / 60 * 10,
  ) / 10;
  const bibleStudies = myStudents.filter((s) => s.bibleStudyTopics?.some((t) => t.completed)).length;

  const stats = [
    { label: 'Hours',    value: hours,               icon: Clock },
    { label: 'Sessions', value: mySessions.length,   icon: TrendingUp },
    { label: 'Students', value: myStudents.length,   icon: Users },
    { label: 'Bible',    value: bibleStudies,        icon: BookOpen },
  ];

  type MenuItem = { icon: typeof BarChart2; label: string; route: string; color: string };
  const menu: MenuItem[] = [
    { icon: BarChart2,  label: 'Analytics',     route: '/analytics',    color: '#4f46e5' },
    { icon: Target,     label: 'Goals',         route: '/goals',        color: '#16a34a' },
    { icon: BookText,   label: 'Session Logs',  route: '/session-logs', color: '#0891b2' },
    { icon: Users,      label: 'Members',       route: '/members',      color: '#7c3aed' },
    ...(user?.userRole === 'Admin'
      ? [{ icon: Shield, label: 'Manage Roles', route: '/manage-roles', color: '#dc2626' }]
      : []),
  ];

  function confirmLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  const initials = (user?.full_name ?? user?.name ?? '?')[0].toUpperCase();

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Hero */}
      <View className="items-center bg-blue-600 pb-8 pt-14 px-5">
        {user?.profilePhoto ? (
          <Image source={{ uri: user.profilePhoto }} className="h-20 w-20 rounded-full border-2 border-white mb-3" />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-blue-500 mb-3">
            <Text className="text-2xl font-bold text-white">{initials}</Text>
          </View>
        )}
        <Text className="text-xl font-bold text-white">{user?.full_name ?? user?.name}</Text>
        <Text className="mt-0.5 text-sm text-blue-200">{user?.userRole} · {user?.chapterName}</Text>
        {user?.bio ? (
          <Text className="mt-2 max-w-xs text-center text-xs text-blue-100">{user.bio}</Text>
        ) : null}
        <TouchableOpacity
          onPress={() => router.push('/edit-profile')}
          className="mt-3 rounded-full bg-blue-500 px-4 py-1.5"
        >
          <Text className="text-xs font-semibold text-white">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-4">
        {/* Stats */}
        <Card className="mb-4">
          <CardContent className="flex-row justify-around pt-4">
            {stats.map(({ label, value }) => (
              <View key={label} className="items-center">
                <Text className="text-2xl font-bold text-slate-800">{value}</Text>
                <Text className="text-xs text-slate-500">{label}</Text>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Menu */}
        <Card className="mb-4">
          {menu.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
              className={`flex-row items-center gap-3 px-4 py-4 ${i < menu.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${item.color}18` }}
              >
                <item.icon size={18} color={item.color} />
              </View>
              <Text className="flex-1 text-sm font-medium text-slate-700">{item.label}</Text>
              <ChevronRight size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </Card>

        <TouchableOpacity onPress={confirmLogout} className="flex-row items-center gap-3 p-4 mb-8">
          <LogOut size={18} color="#ef4444" />
          <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
