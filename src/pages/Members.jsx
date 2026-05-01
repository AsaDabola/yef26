import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, Shield, ShieldCheck, User, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLE_ICONS = {
  Admin: Shield,
  'Evangelism Leader': ShieldCheck,
  Member: User
};

const ROLE_COLORS = {
  Admin: 'bg-red-100 text-red-700',
  'Evangelism Leader': 'bg-blue-100 text-blue-700',
  Member: 'bg-slate-100 text-slate-700'
};

export default function Members() {
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  // User entity has special security - only admins can list all users
  // Regular users can only see themselves
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['allMembers', currentUser?.role],
    queryFn: async () => {
      const result = await base44.entities.User.list();
      return result;
    },
    enabled: !!currentUser
  });

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.chapterName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">All Members</h1>
          <p className="text-sm text-slate-500">{users.length} members worldwide</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {currentUser?.role !== 'admin' && users.length <= 1 && (
        <Card className="mb-4 bg-amber-50 border-amber-200">
          <CardContent className="py-3">
            <p className="text-sm text-amber-700">
              Only admins can view all members. Contact your chapter admin to be granted access.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or chapter..."
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(user => {
            const RoleIcon = ROLE_ICONS[user.userRole] || User;
            return (
              <Card key={user.id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-slate-400">
                          {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{user.full_name}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{user.chapterName || user.country || 'No chapter'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] ${ROLE_COLORS[user.userRole] || ROLE_COLORS.Member}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {user.userRole || 'Member'}
                        </Badge>
                        {user.role === 'admin' && (
                          <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-600">
                            Super Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No members found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}