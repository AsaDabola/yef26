import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, Users, UserPlus, MapPin, Calendar, FileDown, 
  ChevronRight, Settings, LogOut, Image, GraduationCap, Camera, Shield, BarChart3, Edit
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import CameraCapture from '@/components/CameraCapture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handlePhotoUpdate = async (url) => {
    await base44.auth.updateMe({ profilePhoto: url });
    const updated = await base44.auth.me();
    setUser(updated);
  };

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['mySessions', user?.id],
    queryFn: () => base44.entities.EvangelismSession.filter({ userId: user?.id }, '-created_date', 100),
    enabled: !!user
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['myStudents', user?.id],
    queryFn: () => base44.entities.Student.filter({ evangelizedByUserId: user?.id }, '-created_date', 100),
    enabled: !!user
  });

  const totalHours = Math.round(sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60);
  const totalSessions = sessions.length;
  const totalStudents = students.length;

  // Get unique locations
  const locations = [...new Set(sessions.map(s => s.locationName).filter(Boolean))];
  const universities = [...new Set(students.map(s => s.universityName).filter(Boolean))];

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Duration (min)', 'Location', 'Type', 'Students Count'];
    const rows = sessions.map(s => [
      moment(s.created_date).format('YYYY-MM-DD'),
      s.durationMinutes || 0,
      s.locationName || '',
      s.modeType || '',
      s.studentIds?.length || 0
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evangelism-logs-${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
  };

  const isLoading = loadingSessions || loadingStudents;

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Profile Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">
                {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowCamera(true)}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{user?.full_name}</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              {user?.userRole || 'Member'}
            </Badge>
            {user?.role === 'admin' && (
              <Badge className="bg-purple-100 text-purple-700 text-xs">
                Super Admin
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {user?.membershipStatus || 'Active'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Edit Profile Button */}
      <Link to={createPageUrl('EditProfile')}>
        <Button variant="outline" className="w-full mb-4">
          <Settings className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </Link>

      {/* Chapter Info */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{user?.chapterName}</p>
              <p className="text-xs text-slate-500">
                {[user?.city, user?.state, user?.country].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="py-4 text-center">
              <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{totalHours}</p>
              <p className="text-[10px] text-slate-500 uppercase">Hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Calendar className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{totalSessions}</p>
              <p className="text-[10px] text-slate-500 uppercase">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <UserPlus className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
              <p className="text-[10px] text-slate-500 uppercase">Students</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Places Evangelized */}
      {(locations.length > 0 || universities.length > 0) && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              Places Reached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {universities.slice(0, 5).map(uni => (
                <Badge key={uni} variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                  {uni}
                </Badge>
              ))}
              {locations.slice(0, 3).map(loc => (
                <Badge key={loc} variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                  {loc}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Sessions</CardTitle>
            <Link 
              to={createPageUrl('SessionLogs')}
              className="text-xs text-blue-600 flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 3).map(session => (
                <div key={session.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {session.durationMinutes || 0} minutes
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.locationName || session.modeType} • {session.studentIds?.length || 0} students
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {moment(session.created_date).format('MMM D')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No sessions yet</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Link to={createPageUrl('Analytics')}>
          <Button variant="outline" className="w-full justify-start">
            <BarChart3 className="w-4 h-4 mr-3" />
            View Analytics
          </Button>
        </Link>

        {user?.role === 'admin' && (
          <Link to={createPageUrl('ManageRoles')}>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-3" />
              Manage Roles
            </Button>
          </Link>
        )}
        
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          disabled={sessions.length === 0}
          className="w-full justify-start"
        >
          <FileDown className="w-4 h-4 mr-3" />
          Export Logs (CSV)
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Log Out
        </Button>
      </div>

      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onCapture={handlePhotoUpdate}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}