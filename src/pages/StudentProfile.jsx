import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, MessageCircle, GraduationCap, Phone, Mail, 
  MapPin, Calendar, BookOpen, Edit2, Save, Loader2, User, Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { AnimatePresence } from 'framer-motion';
import CameraCapture from '@/components/CameraCapture';

const STATUS_OPTIONS = [
  'Evangelized',
  'Contact Exchanged',
  'Bible Study Started',
  'Bible Study In Progress',
  'Visiting Fellowship',
  'Connected to Chapter',
  'Discipled / Serving',
  'Not Interested / Closed'
];

const BIBLE_TOPICS = [
  'Introduction to the Gospel',
  'Who is Jesus?',
  'Sin and Salvation',
  'The Cross and Resurrection',
  'Faith and Grace',
  'The Holy Spirit',
  'Prayer and Worship',
  'Reading the Bible',
  'Living as a Christian',
  'Community and Church'
];

const statusColors = {
  'Evangelized': 'bg-blue-100 text-blue-700 border-blue-200',
  'Contact Exchanged': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Bible Study Started': 'bg-purple-100 text-purple-700 border-purple-200',
  'Bible Study In Progress': 'bg-violet-100 text-violet-700 border-violet-200',
  'Visiting Fellowship': 'bg-green-100 text-green-700 border-green-200',
  'Connected to Chapter': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Discipled / Serving': 'bg-teal-100 text-teal-700 border-teal-200',
  'Not Interested / Closed': 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function StudentProfile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showCamera, setShowCamera] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get('id');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const students = await base44.entities.Student.filter({ id: studentId });
      return students[0];
    },
    enabled: !!studentId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.update(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['student', studentId]);
      setIsEditing(false);
    }
  });

  useEffect(() => {
    if (student) {
      setEditData(student);
    }
  }, [student]);

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleTopicToggle = (topic) => {
    const currentTopics = editData.bibleStudyTopics || [];
    const existingIndex = currentTopics.findIndex(t => t.topic === topic);
    
    let newTopics;
    if (existingIndex >= 0) {
      newTopics = currentTopics.map((t, i) => 
        i === existingIndex ? { ...t, completed: !t.completed, completedDate: !t.completed ? new Date().toISOString() : null } : t
      );
    } else {
      newTopics = [...currentTopics, { topic, completed: true, completedDate: new Date().toISOString() }];
    }
    
    setEditData({ ...editData, bibleStudyTopics: newTopics });
  };

  const isTopicCompleted = (topic) => {
    return editData.bibleStudyTopics?.find(t => t.topic === topic)?.completed || false;
  };

  const canEdit = user?.id === student?.evangelizedByUserId || 
                  user?.userRole === 'Admin' || 
                  user?.userRole === 'Evangelism Leader';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-slate-500">Student not found</p>
        <Link to={createPageUrl('Students')} className="text-blue-600 mt-2 inline-block">
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Students')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-800 flex-1">Student Profile</h1>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
        {isEditing && (
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                {(isEditing ? editData.photo : student.photo) ? (
                  <img src={isEditing ? editData.photo : student.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              {isEditing && canEdit && (
                <button
                  onClick={() => setShowCamera(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editData.name || ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="font-semibold text-lg mb-2"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
              )}
              
              {student.universityName && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <GraduationCap className="w-4 h-4" />
                  {student.universityName}
                  {student.collegeYear && ` • ${student.collegeYear}`}
                </p>
              )}
              
              {student.major && (
                <p className="text-xs text-slate-400 mt-0.5">{student.major}</p>
              )}
            </div>
          </div>

          {/* Status Pipeline */}
          <div className="mt-4">
            <Label className="text-xs text-slate-500">Status</Label>
            {isEditing ? (
              <Select
                value={editData.statusPipeline || 'Evangelized'}
                onValueChange={(v) => setEditData({...editData, statusPipeline: v})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge className={`mt-1 ${statusColors[student.statusPipeline] || statusColors['Evangelized']}`}>
                {student.statusPipeline || 'Evangelized'}
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-4 space-y-2">
            {(student.phone || isEditing) && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                {isEditing ? (
                  <Input
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    placeholder="Phone number"
                    className="flex-1"
                  />
                ) : (
                  <a href={`tel:${student.phone}`} className="text-sm text-blue-600">{student.phone}</a>
                )}
              </div>
            )}
            {(student.email || isEditing) && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {isEditing ? (
                  <Input
                    value={editData.email || ''}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    placeholder="Email"
                    className="flex-1"
                  />
                ) : (
                  <a href={`mailto:${student.email}`} className="text-sm text-blue-600">{student.email}</a>
                )}
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Added {moment(student.created_date).format('MMM D, YYYY')}
            </span>
            {student.evangelizedByUserName && (
              <span>by {student.evangelizedByUserName}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bible Study Progress */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            Bible Study Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {BIBLE_TOPICS.map(topic => (
              <div 
                key={topic}
                className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
              >
                <Checkbox
                  checked={isTopicCompleted(topic)}
                  onCheckedChange={() => isEditing && handleTopicToggle(topic)}
                  disabled={!isEditing}
                />
                <span className={`text-sm ${isTopicCompleted(topic) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {topic}
                </span>
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="mt-4">
              <Label className="text-xs text-slate-500">Next Study Plan</Label>
              <Textarea
                value={editData.nextStudyPlan || ''}
                onChange={(e) => setEditData({...editData, nextStudyPlan: e.target.value})}
                placeholder="Plan for next study session..."
                className="mt-1"
                rows={2}
              />
            </div>
          )}
          
          {!isEditing && student.nextStudyPlan && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-xs font-medium text-purple-700">Next Plan:</p>
              <p className="text-sm text-purple-600 mt-1">{student.nextStudyPlan}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({...editData, notes: e.target.value})}
              placeholder="Add notes about this student..."
              rows={3}
            />
          ) : student.notes ? (
            <p className="text-sm text-slate-600">{student.notes}</p>
          ) : (
            <p className="text-sm text-slate-400">No notes yet</p>
          )}
        </CardContent>
      </Card>

      {/* Chat Button */}
      <Link to={createPageUrl(`StudentChat?studentId=${studentId}`)}>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          <MessageCircle className="w-4 h-4 mr-2" />
          Open Chat
        </Button>
      </Link>

      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onCapture={(url) => setEditData({...editData, photo: url})}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}