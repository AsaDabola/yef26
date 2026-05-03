import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Entities, getStudentById } from '@/lib/firestore';
import moment from 'moment';

export default function StudentChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => Entities.StudentChat.filter({ studentId: id }, 'created_date', 100),
    refetchInterval: 8000,
  });

  const { data: student } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudentById(id!),
    enabled: !!id,
  });

  const sendMsg = useMutation({
    mutationFn: () => Entities.StudentChat.create({
      studentId: id,
      message,
      senderId: user?.id,
      senderName: user?.full_name,
    }),
    onSuccess: () => {
      setMessage('');
      qc.invalidateQueries({ queryKey: ['chat', id] });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-slate-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text className="font-semibold text-slate-800">{(student as Record<string, unknown>)?.name as string ?? 'Student'}</Text>
          <Text className="text-xs text-slate-500">Notes & follow-up chat</Text>
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={chats as Record<string, unknown>[]}
          keyExtractor={(item) => item.id as string}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <Text className="text-slate-400 text-sm">No messages yet. Start the conversation!</Text>
            </View>
          }
          renderItem={({ item: chat }) => {
            const isMe = chat.senderId === user?.id;
            return (
              <View className={`max-w-xs ${isMe ? 'self-end' : 'self-start'}`}>
                <View className={`rounded-2xl px-4 py-2.5 ${isMe ? 'bg-blue-600 rounded-br-sm' : 'bg-white border border-slate-100 rounded-bl-sm'}`}>
                  {!isMe && (
                    <Text className="text-xs font-medium text-slate-500 mb-1">{chat.senderName as string}</Text>
                  )}
                  <Text className={`text-sm ${isMe ? 'text-white' : 'text-slate-800'}`}>{chat.message as string}</Text>
                </View>
                <Text className={`text-xs text-slate-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                  {moment(chat.created_date as string).format('h:mm A')}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <View className="bg-white border-t border-slate-100 px-4 py-3 flex-row items-end gap-3">
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Write a note or message..."
          placeholderTextColor="#94a3b8"
          multiline
          className="flex-1 bg-slate-50 rounded-2xl px-4 py-2.5 text-sm text-slate-800 max-h-24"
        />
        <TouchableOpacity
          onPress={() => message.trim() && sendMsg.mutate()}
          disabled={!message.trim() || sendMsg.isPending}
          className={`w-10 h-10 rounded-full items-center justify-center ${message.trim() ? 'bg-blue-600' : 'bg-slate-200'}`}
        >
          <Send size={18} color={message.trim() ? '#fff' : '#94a3b8'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
