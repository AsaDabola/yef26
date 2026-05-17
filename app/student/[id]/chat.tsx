import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react-native';
import moment from 'moment';
import { Entities } from '../../../lib/firestore';
import { useAuth } from '../../../lib/auth';
import type { StudentChat } from '../../../lib/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { data: chats = [] } = useQuery<StudentChat[]>({
    queryKey: ['chats', id],
    queryFn: () =>
      Entities.StudentChat.filter({ studentId: id }, 'created_date', 200) as Promise<StudentChat[]>,
    refetchInterval: 8000,
    enabled: !!id,
  });

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chats.length]);

  const sendMutation = useMutation({
    mutationFn: () =>
      Entities.StudentChat.create({
        studentId: id,
        message: message.trim(),
        senderId: user?.id,
        senderName: user?.full_name ?? user?.name ?? '',
      }),
    onSuccess: () => {
      setMessage('');
      qc.invalidateQueries({ queryKey: ['chats', id] });
    },
  });

  function handleSend() {
    if (!message.trim()) return;
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
            <Text className="text-slate-400 text-sm">No messages yet. Start the conversation!</Text>
          </View>
        )}
        <View className="gap-3 pb-4">
          {chats.map((chat) => {
            const isMe = chat.senderId === user?.id;
            return (
              <View key={chat.id} className={`${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <Text className="text-xs text-slate-400 mb-1 ml-1">{chat.senderName}</Text>
                )}
                <View
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMe ? 'bg-blue-600 rounded-br-sm' : 'bg-white border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  <Text className={`text-sm ${isMe ? 'text-white' : 'text-slate-800'}`}>
                    {chat.message}
                  </Text>
                </View>
                <Text className="text-xs text-slate-400 mt-1 mx-1">
                  {moment(chat.created_date).fromNow()}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View className="flex-row items-end gap-2 px-4 py-3 bg-white border-t border-slate-200">
        <TextInput
          className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-900 max-h-24"
          placeholder="Write a note..."
          placeholderTextColor="#94a3b8"
          value={message}
          onChangeText={setMessage}
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            message.trim() ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <Send size={18} color={message.trim() ? '#fff' : '#94a3b8'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
