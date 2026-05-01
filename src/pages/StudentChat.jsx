import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { cn } from '@/lib/utils';

export default function StudentChat() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get('studentId');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: student } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const students = await base44.entities.Student.filter({ id: studentId });
      return students[0];
    },
    enabled: !!studentId
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', studentId],
    queryFn: () => base44.entities.StudentChat.filter({ studentId }, 'created_date', 100),
    enabled: !!studentId,
    refetchInterval: 5000 // Poll every 5 seconds
  });

  const sendMutation = useMutation({
    mutationFn: (text) => base44.entities.StudentChat.create({
      studentId,
      senderUserId: user?.id,
      senderName: user?.full_name,
      text
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat', studentId]);
      setMessage('');
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Link to={createPageUrl(`StudentProfile?id=${studentId}`)}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
          {student?.photo ? (
            <img src={student.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-slate-800">{student?.name || 'Loading...'}</h1>
          <p className="text-xs text-slate-500">Student follow-up chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No messages yet</p>
            <p className="text-slate-300 text-xs mt-1">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderUserId === user?.id;
            const showAvatar = idx === 0 || messages[idx - 1].senderUserId !== msg.senderUserId;
            const showTime = idx === messages.length - 1 || 
              messages[idx + 1].senderUserId !== msg.senderUserId ||
              moment(messages[idx + 1].created_date).diff(moment(msg.created_date), 'minutes') > 5;

            return (
              <div key={msg.id} className={cn("flex gap-2", isMe && "flex-row-reverse")}>
                {showAvatar ? (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    isMe ? "bg-blue-600" : "bg-slate-200"
                  )}>
                    <span className={cn("text-xs font-medium", isMe ? "text-white" : "text-slate-500")}>
                      {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                ) : (
                  <div className="w-8" />
                )}
                <div className={cn("max-w-[75%]", isMe && "items-end")}>
                  {showAvatar && !isMe && (
                    <p className="text-[10px] text-slate-400 mb-1 ml-1">{msg.senderName}</p>
                  )}
                  <div className={cn(
                    "rounded-2xl px-4 py-2",
                    isMe 
                      ? "bg-blue-600 text-white rounded-br-md" 
                      : "bg-white text-slate-800 rounded-bl-md shadow-sm"
                  )}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  {showTime && (
                    <p className={cn("text-[10px] text-slate-400 mt-1", isMe ? "text-right mr-1" : "ml-1")}>
                      {moment(msg.created_date).format('h:mm A')}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 border-slate-200"
          />
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}