import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useEvangelizing } from '@/Layout';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Play, Square, UserPlus, Newspaper, Clock, MapPin, Users, 
  Camera, Loader2, Check, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

export default function Add() {
  const { isEvangelizing, sessionData, startEvangelizing, stopEvangelizing, addStudentToSession } = useEvangelizing();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('session');
  const [saving, setSaving] = useState(false);
  const [showQuickStudent, setShowQuickStudent] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Session form
  const [sessionForm, setSessionForm] = useState({
    modeType: 'Individual',
    locationName: '',
    notes: ''
  });

  // Student form
  const [studentForm, setStudentForm] = useState({
    name: '',
    universityName: '',
    phone: '',
    email: '',
    notes: ''
  });

  // News form
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    eventDate: '',
    isGlobal: false
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'news') {
      setActiveTab('news');
    }
  }, []);

  // Timer for evangelizing mode
  useEffect(() => {
    let interval;
    if (isEvangelizing && sessionData?.startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date() - new Date(sessionData.startTime)) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEvangelizing, sessionData]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartEvangelizing = () => {
    startEvangelizing({
      modeType: sessionForm.modeType,
      locationName: sessionForm.locationName,
      notes: sessionForm.notes
    });
  };

  const handleStopEvangelizing = async () => {
    setSaving(true);
    const result = stopEvangelizing();
    
    await base44.entities.EvangelismSession.create({
      ...result,
      userId: user?.id,
      userName: user?.full_name,
      chapterId: user?.chapterId,
      chapterName: user?.chapterName,
      country: user?.country
    });
    
    setSaving(false);
    window.location.href = createPageUrl('Profile');
  };

  const handleQuickAddStudent = async () => {
    if (!studentForm.name) return;
    setSaving(true);
    
    const student = await base44.entities.Student.create({
      ...studentForm,
      evangelizedByUserId: user?.id,
      evangelizedByUserName: user?.full_name,
      evangelizedByChapterId: user?.chapterId,
      evangelizedByChapterName: user?.chapterName,
      country: user?.country,
      statusPipeline: 'Evangelized'
    });

    if (isEvangelizing) {
      addStudentToSession(student.id);
    }

    setStudentForm({ name: '', universityName: '', phone: '', email: '', notes: '' });
    setShowQuickStudent(false);
    setSaving(false);
  };

  const handleCreateNews = async () => {
    if (!newsForm.title || !newsForm.content) return;
    setSaving(true);
    
    await base44.entities.NewsPost.create({
      ...newsForm,
      chapterId: newsForm.isGlobal ? null : user?.chapterId,
      chapterName: newsForm.isGlobal ? null : user?.chapterName,
      country: user?.country
    });

    setNewsForm({ title: '', content: '', eventDate: '', isGlobal: false });
    setSaving(false);
    window.location.href = createPageUrl('News');
  };

  const canCreateNews = user?.userRole === 'Admin' || user?.userRole === 'Evangelism Leader';

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {isEvangelizing ? 'Evangelizing Mode' : 'Quick Actions'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEvangelizing ? 'Session in progress' : 'Start a session or add records'}
        </p>
      </div>

      {/* Evangelizing Mode Active */}
      {isEvangelizing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-xl">
            <CardContent className="pt-6">
              {/* Timer */}
              <div className="text-center mb-6">
                <p className="text-blue-200 text-sm mb-2">Time Evangelizing</p>
                <p className="text-5xl font-mono font-bold tracking-tight">
                  {formatTime(elapsedTime)}
                </p>
              </div>

              {/* Session Info */}
              <div className="flex items-center justify-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-1 text-blue-200">
                  <Users className="w-4 h-4" />
                  {sessionData?.modeType}
                </div>
                {sessionData?.locationName && (
                  <div className="flex items-center gap-1 text-blue-200">
                    <MapPin className="w-4 h-4" />
                    {sessionData.locationName}
                  </div>
                )}
                <div className="flex items-center gap-1 text-blue-200">
                  <UserPlus className="w-4 h-4" />
                  {sessionData?.studentIds?.length || 0} students
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowQuickStudent(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
                <Button 
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              {/* Stop Button */}
              <Button 
                onClick={handleStopEvangelizing}
                disabled={saving}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                End Session
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Student Modal */}
      <AnimatePresence>
        {showQuickStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowQuickStudent(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Quick Add Student</h3>
                <button onClick={() => setShowQuickStudent(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                    placeholder="Student's name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>University</Label>
                  <Input
                    value={studentForm.universityName}
                    onChange={(e) => setStudentForm({...studentForm, universityName: e.target.value})}
                    placeholder="e.g., UCLA"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                      placeholder="Phone number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                      placeholder="Email"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleQuickAddStudent}
                  disabled={!studentForm.name || saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Student'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Session Form (when not evangelizing) */}
      {!isEvangelizing && (
        <div className="space-y-4">
          {/* Start Evangelizing Card */}
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                Start Evangelizing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Session Type</Label>
                <Select
                  value={sessionForm.modeType}
                  onValueChange={(v) => setSessionForm({...sessionForm, modeType: v})}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input
                  value={sessionForm.locationName}
                  onChange={(e) => setSessionForm({...sessionForm, locationName: e.target.value})}
                  placeholder="e.g., Campus Library"
                  className="mt-1 bg-white"
                />
              </div>
              <Button 
                onClick={handleStartEvangelizing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </CardContent>
          </Card>

          {/* Quick Add Student */}
          <Card>
            <CardContent className="pt-4">
              <button 
                onClick={() => setShowQuickStudent(true)}
                className="w-full flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800">Add New Student</p>
                    <p className="text-xs text-slate-500">Record a student contact</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          {/* Create News (Leaders/Admin only) */}
          {canCreateNews && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-indigo-600" />
                  Create News Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                    placeholder="Post title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Content *</Label>
                  <Textarea
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                    placeholder="Write your update..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Event Date (optional)</Label>
                  <Input
                    type="date"
                    value={newsForm.eventDate}
                    onChange={(e) => setNewsForm({...newsForm, eventDate: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Post Globally</Label>
                  <Switch
                    checked={newsForm.isGlobal}
                    onCheckedChange={(v) => setNewsForm({...newsForm, isGlobal: v})}
                  />
                </div>
                <Button 
                  onClick={handleCreateNews}
                  disabled={!newsForm.title || !newsForm.content || saving}
                  className="w-full"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Post'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}