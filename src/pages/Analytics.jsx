import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import moment from 'moment';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('country');
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: sessions = [] } = useQuery({
    queryKey: ['allSessions'],
    queryFn: () => base44.entities.EvangelismSession.list('-created_date', 1000),
    enabled: !!user
  });

  const { data: students = [] } = useQuery({
    queryKey: ['allStudents'],
    queryFn: () => base44.entities.Student.list('-created_date', 1000),
    enabled: !!user
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  const isAdmin = user?.role === 'admin';

  const getChartData = () => {
    let filtered = sessions;
    if (selectedUser !== 'all' && isAdmin) {
      filtered = sessions.filter(s => s.userId === selectedUser);
    }

    switch (xAxis) {
      case 'country': {
        const grouped = {};
        filtered.forEach(s => {
          const country = s.country || 'Unknown';
          grouped[country] = (grouped[country] || 0) + (s.durationMinutes || 0);
        });
        return Object.entries(grouped).map(([name, minutes]) => ({
          name,
          hours: Math.round(minutes / 60)
        }));
      }
      case 'person': {
        if (!isAdmin) return [];
        const grouped = {};
        filtered.forEach(s => {
          const person = s.userName || 'Unknown';
          grouped[person] = (grouped[person] || 0) + (s.durationMinutes || 0);
        });
        return Object.entries(grouped).map(([name, minutes]) => ({
          name,
          hours: Math.round(minutes / 60)
        }));
      }
      case 'hour': {
        const grouped = {};
        filtered.forEach(s => {
          const hour = moment(s.startTime).format('ha');
          grouped[hour] = (grouped[hour] || 0) + (s.durationMinutes || 0);
        });
        return Object.entries(grouped).map(([name, minutes]) => ({
          name,
          hours: Math.round(minutes / 60)
        })).sort((a, b) => {
          const aHour = parseInt(a.name);
          const bHour = parseInt(b.name);
          return aHour - bHour;
        });
      }
      case 'weekday': {
        const grouped = {};
        filtered.forEach(s => {
          const day = moment(s.created_date).format('ddd');
          grouped[day] = (grouped[day] || 0) + (s.durationMinutes || 0);
        });
        const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return order.map(day => ({
          name: day,
          hours: Math.round((grouped[day] || 0) / 60)
        }));
      }
      case 'month': {
        const grouped = {};
        filtered.forEach(s => {
          const month = moment(s.created_date).format('MMM YYYY');
          grouped[month] = (grouped[month] || 0) + (s.durationMinutes || 0);
        });
        return Object.entries(grouped).map(([name, minutes]) => ({
          name,
          hours: Math.round(minutes / 60)
        })).sort((a, b) => moment(a.name, 'MMM YYYY').diff(moment(b.name, 'MMM YYYY')));
      }
      default:
        return [];
    }
  };

  const chartData = getChartData();

  if (!user) return null;

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">All-time data visualization</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <Tabs value={chartType} onValueChange={setChartType}>
          <TabsList className="w-full">
            <TabsTrigger value="bar" className="flex-1">Bar Chart</TabsTrigger>
            <TabsTrigger value="line" className="flex-1">Line Chart</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={xAxis} onValueChange={setXAxis}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="country">By Country</SelectItem>
            {isAdmin && <SelectItem value="person">By Person</SelectItem>}
            <SelectItem value="hour">By Hour of Day</SelectItem>
            <SelectItem value="weekday">By Day of Week</SelectItem>
            <SelectItem value="month">By Month</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <AnalyticsChart
        data={chartData}
        chartType={chartType}
        title="Evangelism Hours"
        xKey="name"
        yKey="hours"
        color="#3b82f6"
      />
    </div>
  );
}