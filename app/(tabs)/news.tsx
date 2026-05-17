import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  RefreshControl, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Building2, Plus, X } from 'lucide-react-native';
import moment from 'moment';
import { useAuth } from '../../lib/auth';
import { NewsDB } from '../../lib/db';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { NewsPost } from '../../lib/types';

export default function NewsScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canPost = user?.userRole === 'Admin' || user?.userRole === 'Evangelism Leader';

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);

  const { data: posts = [], isFetching, refetch } = useQuery<NewsPost[]>({
    queryKey: ['news'],
    queryFn: () => NewsDB.list('-created_date', 200) as Promise<NewsPost[]>,
  });

  const visible = posts.filter((p) => p.isGlobal || p.chapterId === user?.chapterId);

  const createMutation = useMutation({
    mutationFn: () =>
      NewsDB.create({
        title: title.trim(),
        content: content.trim(),
        isGlobal,
        chapterId: isGlobal ? null : user?.chapterId,
        chapterName: isGlobal ? null : user?.chapterName,
        country: user?.country ?? '',
        authorId: user?.id,
        authorName: user?.full_name ?? user?.name ?? '',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news'] });
      setShowModal(false);
      setTitle(''); setContent(''); setIsGlobal(false);
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 pb-4 pt-14">
        <Text className="text-xl font-bold text-slate-800">News Feed</Text>
        {canPost && (
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="h-9 w-9 items-center justify-center rounded-xl bg-blue-600"
          >
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {visible.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-sm text-slate-400">No news posts yet</Text>
          </View>
        )}
        <View className="gap-3 pb-6">
          {visible.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-4">
                <View className="mb-2 flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-semibold text-slate-800">{post.title}</Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      {post.isGlobal
                        ? <Globe size={11} color="#2563eb" />
                        : <Building2 size={11} color="#7c3aed" />}
                      <Text className="text-xs text-slate-500">
                        {post.isGlobal ? 'Global' : post.chapterName}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-400">{moment(post.created_date).fromNow()}</Text>
                </View>
                <Text className="text-sm leading-relaxed text-slate-600">{post.content}</Text>
                <Text className="mt-3 text-xs text-slate-400">— {post.authorName}</Text>
              </CardContent>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Create post modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="flex-row items-center justify-between border-b border-slate-100 px-5 pb-4 pt-6">
            <Text className="text-lg font-bold text-slate-800">New Post</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              <Input label="Title" placeholder="Post title" value={title} onChangeText={setTitle} />
              <Input
                label="Content"
                placeholder="Write your post…"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
              />
              <TouchableOpacity
                onPress={() => setIsGlobal((v) => !v)}
                className={`flex-row items-center gap-3 rounded-xl border p-4 ${
                  isGlobal ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
                }`}
              >
                <Globe size={18} color={isGlobal ? '#2563eb' : '#94a3b8'} />
                <View>
                  <Text className={`text-sm font-semibold ${isGlobal ? 'text-blue-700' : 'text-slate-700'}`}>
                    Post Globally
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {isGlobal ? 'Visible to all chapters' : 'Only your chapter sees this'}
                  </Text>
                </View>
              </TouchableOpacity>
              <Button
                onPress={() => {
                  if (!title.trim() || !content.trim()) {
                    Alert.alert('Required', 'Please fill in title and content');
                    return;
                  }
                  createMutation.mutate();
                }}
                loading={createMutation.isPending}
                fullWidth
              >
                Publish
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
