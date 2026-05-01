import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, SlidersHorizontal, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import StudentCard from '@/components/home/StudentCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_OPTIONS = [
  'All Statuses',
  'Evangelized',
  'Contact Exchanged',
  'Bible Study Started',
  'Bible Study In Progress',
  'Visiting Fellowship',
  'Connected to Chapter',
  'Discipled / Serving',
  'Not Interested / Closed'
];

export default function Students() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'All Statuses',
    scope: 'all'
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch ALL students globally for everyone to see
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['allStudentsGlobal'],
    queryFn: () => base44.entities.Student.list('-created_date', 1000),
    enabled: !!user
  });

  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = !searchQuery || 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.universityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.major?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = filters.status === 'All Statuses' || 
      student.statusPipeline === filters.status;

    // Scope filter
    const matchesScope = filters.scope === 'all' ||
      (filters.scope === 'mine' && student.evangelizedByUserId === user?.id) ||
      (filters.scope === 'chapter' && student.evangelizedByChapterId === user?.chapterId);

    return matchesSearch && matchesStatus && matchesScope;
  });

  const activeFilterCount = [
    filters.status !== 'All Statuses',
    filters.scope !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filteredStudents.length} contacts</p>
        </div>
        <Link to={createPageUrl('Add')}>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="pl-10 bg-white"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(v) => setFilters({...filters, status: v})}
                >
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Scope</label>
                <Select
                  value={filters.scope}
                  onValueChange={(v) => setFilters({...filters, scope: v})}
                >
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="mine">My Students</SelectItem>
                    <SelectItem value="chapter">My Chapter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFilters({ status: 'All Statuses', scope: 'all' })}
                  className="flex-1"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.status !== 'All Statuses' && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {filters.status}
              <button 
                onClick={() => setFilters({...filters, status: 'All Statuses'})}
                className="ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.scope !== 'all' && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
              {filters.scope === 'mine' ? 'My Students' : 'My Chapter'}
              <button 
                onClick={() => setFilters({...filters, scope: 'all'})}
                className="ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Students List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="space-y-3">
          {filteredStudents.map(student => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {searchQuery || activeFilterCount > 0 
              ? 'No students match your filters' 
              : 'No students yet'}
          </p>
          {!searchQuery && activeFilterCount === 0 && (
            <Link 
              to={createPageUrl('Add')}
              className="text-sm text-blue-600 mt-2 inline-block hover:underline"
            >
              Add your first student
            </Link>
          )}
        </div>
      )}
    </div>
  );
}