import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Calendar, Globe, MapPin } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Entities } from '@/lib/firestore';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import moment from 'moment';

export default function NewsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['news', user?.chapterId],
    queryFn: async () => {
      const [global, local] = await Promise.all([
        Entities.NewsPost.filter({ isGlobal: true }, '-created_date', 50),
        user?.chapterId
          ? Entities.NewsPost.filter({ chapterId: user.chapterId }, '-created_date', 50)
          : Promise.resolve([]),
      ]);
      const all = [...global, ...local];
      const unique = Array.from(new Map(all.map((p: Record<string, unknown>) => [p.id, p])).values());
      return unique.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date(b.created_date as string).getTime() - new Date(a.created_date as string).getTime()
      );
    },
    enabled: !!user,
  });

  const canPost = user?.userRole === 'Admin' || user?.userRole === 'Evangelism Leader';

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-4 pt-12 pb-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-800">News</Text>
        {canPost && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/add')}
            className="w-9 h-9 bg-blue-600 rounded-full items-center justify-center"
          >
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={posts as Record<string, unknown>[]}
          keyExtractor={(item) => item.id as string}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">📰</Text>
              <Text className="text-slate-400">No news yet</Text>
            </View>
          }
          renderItem={({ item: post }) => (
            <Card className="p-4">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-base font-semibold text-slate-800 flex-1 mr-2">{post.title as string}</Text>
                <Badge variant={post.isGlobal ? 'blue' : 'indigo'}>
                  {post.isGlobal ? 'Global' : 'Local'}
                </Badge>
              </View>
              <Text className="text-sm text-slate-600 leading-5 mb-3">{post.content as string}</Text>
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Calendar size={12} color="#94a3b8" />
                  <Text className="text-xs text-slate-400">
                    {moment(post.created_date as string).format('MMM D, YYYY')}
                  </Text>
                </View>
                {Boolean(post.chapterName) && (
                  <View className="flex-row items-center gap-1">
                    <MapPin size={12} color="#94a3b8" />
                    <Text className="text-xs text-slate-400">{post.chapterName as string}</Text>
                  </View>
                )}
                {Boolean(post.isGlobal) && (
                  <View className="flex-row items-center gap-1">
                    <Globe size={12} color="#94a3b8" />
                    <Text className="text-xs text-slate-400">Global</Text>
                  </View>
                )}
              </View>
              {Boolean(post.authorName) && (
                <Text className="text-xs text-slate-400 mt-2">by {post.authorName as string}</Text>
              )}
            </Card>
          )}
        />
      )}
    </View>
  );
}
