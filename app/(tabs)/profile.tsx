import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  LogOut, Edit2, BarChart3, Target, Clock, Users as UsersIcon,
  BookOpen, Shield, ChevronRight, UserPlus,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Entities } from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import moment from 'moment';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  const { data: mySessions = [], isLoading, refetch } = useQuery({
    queryKey: ['mySessions', user?.id],
    queryFn: () => Entities.EvangelismSession.filter({ userId: user?.id }, '-created_date', 200),
    enabled: !!user,
  });

  const { data: myStudents = [] } = useQuery({
    queryKey: ['myStudents', user?.id],
    queryFn: () => Entities.Student.filter({ evangelizedByUserId: user?.id }, '-created_date', 200),
    enabled: !!user,
  });

  const totalHours = Math.round(
    (mySessions as Record<string, unknown>[]).reduce((s, x) => s + ((x.durationMinutes as number) || 0), 0) / 60
  );
  const bibleStudies = (myStudents as Record<string, unknown>[]).filter((s) =>
    ['Bible Study Started', 'Bible Study In Progress'].includes(s.statusPipeline as string)
  ).length;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: BarChart3, label: 'Analytics', route: '/analytics' },
    { icon: Target, label: 'Goals', route: '/goals' },
    { icon: Clock, label: 'Session Logs', route: '/session-logs' },
    { icon: UsersIcon, label: 'Members', route: '/members' },
    ...(user?.userRole === 'Admin' ? [{ icon: Shield, label: 'Manage Roles', route: '/manage-roles' }] : []),
  ];

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={async () => { await refetch(); await refreshUser(); }} />}
    >
      <View className="px-4 pt-12 pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-slate-800">Profile</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => router.push('/edit-profile')}
              className="w-9 h-9 border border-slate-200 rounded-full items-center justify-center bg-white">
              <Edit2 size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}
              className="w-9 h-9 border border-slate-200 rounded-full items-center justify-center bg-white">
              <LogOut size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <Card className="mb-5 p-5 items-center">
          <View className="w-20 h-20 rounded-2xl bg-blue-600 items-center justify-center mb-3 shadow-md">
            <Text className="text-white text-3xl font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-800">{user?.full_name}</Text>
          <Text className="text-sm text-slate-500 mt-0.5">{user?.email}</Text>
          <View className="flex-row gap-2 mt-2">
            <Badge variant="blue">{user?.userRole ?? 'Member'}</Badge>
            {user?.chapterName && <Badge variant="indigo">{user.chapterName}</Badge>}
          </View>
          {user?.bio && <Text className="text-sm text-slate-600 mt-3 text-center">{user.bio}</Text>}
          <View className="flex-row gap-4 mt-4">
            <Text className="text-xs text-slate-400">{user?.country}</Text>
            {user?.city && <Text className="text-xs text-slate-400">· {user.city}</Text>}
          </View>
        </Card>

        {/* Stats */}
        <Text className="font-semibold text-slate-700 mb-3">My Stats</Text>
        <View className="flex-row gap-3 mb-5">
          {[
            { label: 'Hours', value: totalHours, color: 'bg-blue-50' },
            { label: 'Sessions', value: mySessions.length, color: 'bg-indigo-50' },
            { label: 'Students', value: myStudents.length, color: 'bg-green-50' },
            { label: 'Bible Studies', value: bibleStudies, color: 'bg-purple-50' },
          ].map((stat) => (
            <View key={stat.label} className={`flex-1 ${stat.color} rounded-2xl p-3 items-center`}>
              <Text className="text-xl font-bold text-slate-800">{stat.value}</Text>
              <Text className="text-xs text-slate-500 mt-0.5 text-center">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <Text className="font-semibold text-slate-700 mb-3">More</Text>
        <Card>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as never)}
              className={`flex-row items-center px-4 py-3.5 gap-3 ${i < menuItems.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <item.icon size={18} color="#64748b" />
              <Text className="flex-1 text-sm text-slate-700">{item.label}</Text>
              <ChevronRight size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
