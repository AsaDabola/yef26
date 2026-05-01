import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Clock, MapPin, Users, FileDown, Calendar,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { cn } from '@/lib/utils';

export default function SessionLogs() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['mySessions', user?.id],
    queryFn: () => base44.entities.EvangelismSession.filter({ userId: user?.id }, '-created_date', 200),
    enabled: !!user
  });

  const { data: students = [] } = useQuery({
    queryKey: ['myStudents', user?.id],
    queryFn: () => base44.entities.Student.filter({ evangelizedByUserId: user?.id }),
    enabled: !!user
  });

  const getFilteredSessions = () => {
    if (timeRange === 'all') return sessions;
    const now = moment();
    return sessions.filter(s => {
      const date = moment(s.created_date);
      switch (timeRange) {
        case 'week': return date.isAfter(now.clone().subtract(1, 'week'));
        case 'month': return date.isAfter(now.clone().subtract(1, 'month'));
        case 'quarter': return date.isAfter(now.clone().subtract(3, 'months'));
        default: return true;
      }
    });
  };

  const filteredSessions = getFilteredSessions();
  const totalMinutes = filteredSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const totalStudents = filteredSessions.reduce((sum, s) => sum + (s.studentIds?.length || 0), 0);

  const getSessionStudents = (sessionStudentIds) => {
    if (!sessionStudentIds?.length) return [];
    return students.filter(s => sessionStudentIds.includes(s.id));
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Location', 'Type', 'Students Count', 'Notes'];
    const rows = filteredSessions.map(s => [
      moment(s.created_date).format('YYYY-MM-DD'),
      moment(s.startTime).format('HH:mm'),
      s.endTime ? moment(s.endTime).format('HH:mm') : '',
      s.durationMinutes || 0,
      s.locationName || '',
      s.modeType || '',
      s.studentIds?.length || 0,
      (s.notes || '').replace(/,/g, ';')
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evangelism-sessions-${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
  };

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Profile')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">Session Logs</h1>
          <p className="text-sm text-slate-500">{filteredSessions.length} sessions recorded</p>
        </div>
      </div>

      {/* Summary & Filters */}
      <div className="flex gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-lg font-bold text-slate-800">
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </p>
                <p className="text-[10px] text-slate-500">Total Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-lg font-bold text-slate-800">{totalStudents}</p>
                <p className="text-[10px] text-slate-500">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="flex-1 bg-white">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          disabled={filteredSessions.length === 0}
        >
          <FileDown className="w-4 h-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map(session => {
            const isExpanded = expandedSession === session.id;
            const sessionStudents = getSessionStudents(session.studentIds);
            
            return (
              <Card 
                key={session.id}
                className={cn(
                  "transition-all cursor-pointer",
                  isExpanded && "ring-2 ring-blue-200"
                )}
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {moment(session.created_date).format('MMM')}
                        </span>
                        <span className="text-lg font-bold text-blue-700">
                          {moment(session.created_date).format('D')}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">
                            {session.durationMinutes || 0} minutes
                          </p>
                          <Badge variant="secondary" className="text-[10px]">
                            {session.modeType || 'Individual'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {session.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.locationName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {session.studentIds?.length || 0} students
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-slate-500 text-xs">Start Time</p>
                          <p className="font-medium">{moment(session.startTime).format('h:mm A')}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">End Time</p>
                          <p className="font-medium">
                            {session.endTime ? moment(session.endTime).format('h:mm A') : '-'}
                          </p>
                        </div>
                      </div>

                      {session.notes && (
                        <div className="mb-3">
                          <p className="text-slate-500 text-xs mb-1">Notes</p>
                          <p className="text-sm text-slate-600">{session.notes}</p>
                        </div>
                      )}

                      {sessionStudents.length > 0 && (
                        <div>
                          <p className="text-slate-500 text-xs mb-2">Students Evangelized</p>
                          <div className="flex flex-wrap gap-2">
                            {sessionStudents.map(student => (
                              <Link
                                key={student.id}
                                to={createPageUrl(`StudentProfile?id=${student.id}`)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition"
                              >
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                  {student.photo ? (
                                    <img src={student.photo} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] font-medium text-slate-500">
                                      {student.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{student.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No sessions recorded yet</p>
          <Link 
            to={createPageUrl('Add')}
            className="text-sm text-blue-600 mt-2 inline-block hover:underline"
          >
            Start your first session
          </Link>
        </div>
      )}
    </div>
  );
}