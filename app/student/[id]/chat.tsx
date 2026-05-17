import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react-native';
import moment from 'moment';
import { ChatDB } from '../../../lib/db';
import { useAuth } from '../../../lib/auth';
import type { StudentChat } from '../../../lib/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { data: chats = [] } = useQuery<StudentChat[]>({
    queryKey: ['chat', id],
    queryFn: () => ChatDB.filter({ studentId: id }, 'created_date', 200) as Promise<StudentChat[]>,
    refetchInterval: 8000,
    enabled: !!id,
  });

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [chats.length]);

  const sendMutation = useMutation({
    mutationFn: () =>
      ChatDB.create({
        studentId: id,
        message: text.trim(),
        senderId: user?.id,
        senderName: user?.full_name ?? user?.name ?? '',
      }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['chat', id] });
    },
  });

  function send() {
    if (!text.trim() || sendMutation.isPending) return;
    sendMutation.mutate();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 py-4"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {chats.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-sm text-slate-400">No notes yet. Start the conversation!</Text>
          </View>
        )}
        <View className="gap-3 pb-4">
          {chats.map((c) => {
            const isMe = c.senderId === user?.id;
            return (
              <View key={c.id} className={isMe ? 'items-end' : 'items-start'}>
                {!isMe && (
                  <Text className="mb-1 ml-1 text-xs text-slate-400">{c.senderName}</Text>
                )}
                <View
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMe
                      ? 'rounded-br-sm bg-blue-600'
                      : 'rounded-bl-sm border border-slate-200 bg-white'
                  }`}
                >
                  <Text className={`text-sm ${isMe ? 'text-white' : 'text-slate-800'}`}>
                    {c.message}
                  </Text>
                </View>
                <Text className="mx-1 mt-1 text-xs text-slate-400">
                  {moment(c.created_date).fromNow()}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Input bar */}
      <View className="flex-row items-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
        <TextInput
          className="max-h-24 flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-900"
          placeholder="Write a note…"
          placeholderTextColor="#94a3b8"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          onPress={send}
          disabled={!text.trim() || sendMutation.isPending}
          className={`h-11 w-11 items-center justify-center rounded-full ${
            text.trim() ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <Send size={18} color={text.trim() ? '#fff' : '#94a3b8'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
