import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, ShieldAlert, ShieldCheck, User, Search, Crown, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ROLE_ICONS = {
  Admin: ShieldAlert,
  'Evangelism Leader': ShieldCheck,
  Member: User
};

const ROLE_COLORS = {
  Admin: 'bg-red-100 text-red-700',
  'Evangelism Leader': 'bg-blue-100 text-blue-700',
  Member: 'bg-slate-100 text-slate-700'
};

export default function ManageRoles() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [transferTarget, setTransferTarget] = useState(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, userRole, systemRole }) => {
      const updates = { userRole };
      if (systemRole !== undefined) {
        return base44.entities.User.update(userId, { ...updates, role: systemRole });
      }
      return base44.entities.User.update(userId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
    }
  });

  const transferSuperAdminMutation = useMutation({
    mutationFn: async (targetUserId) => {
      // Give target user super admin
      await base44.entities.User.update(targetUserId, { role: 'admin', userRole: 'Admin' });
      // Remove super admin from current user
      await base44.auth.updateMe({ role: 'user' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      window.location.href = createPageUrl('Profile');
    }
  });

  const handleRoleChange = (userId, userRole) => {
    const systemRole = userRole === 'Admin' ? 'admin' : 'user';
    updateRoleMutation.mutate({ userId, userRole, systemRole });
  };

  const handleTransferSuperAdmin = (user) => {
    setTransferTarget(user);
    setShowTransferDialog(true);
  };

  const confirmTransfer = () => {
    if (transferTarget) {
      transferSuperAdminMutation.mutate(transferTarget.id);
    }
    setShowTransferDialog(false);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (currentUser?.role !== 'admin') {
    return (
      <div className="px-4 pt-6 text-center">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Access denied</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Profile')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">Manage Roles</h1>
          <p className="text-sm text-slate-500">{users.length} users</p>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-slate-400">
                          {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{user.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] ${ROLE_COLORS[user.userRole]}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {user.userRole || 'Member'}
                        </Badge>
                        {user.role === 'admin' && (
                          <Badge variant="outline" className="text-[10px] border-red-200 text-red-600">
                            System Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    {user.id !== currentUser.id && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.userRole || 'Member'}
                          onValueChange={(v) => handleRoleChange(user.id, v)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Member">Member</SelectItem>
                            <SelectItem value="Evangelism Leader">Leader</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {user.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTransferSuperAdmin(user)}
                            className="text-purple-600 hover:bg-purple-50"
                            title="Transfer Super Admin"
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Transfer Super Admin Dialog */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Transfer Super Admin
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer Super Admin status to <strong>{transferTarget?.full_name}</strong>? 
              You will lose your Super Admin privileges and this action cannot be undone by you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTransfer}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Transfer Super Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}