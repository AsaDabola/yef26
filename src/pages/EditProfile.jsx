import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import CameraCapture from '@/components/CameraCapture';

export default function EditProfile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        full_name: u.full_name || '',
        email: u.email || '',
        bio: u.bio || ''
      });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      bio: form.bio
    });
    setSaving(false);
    window.location.href = createPageUrl('Profile');
  };

  const handlePhotoUpdate = async (url) => {
    await base44.auth.updateMe({ profilePhoto: url });
    const updated = await base44.auth.me();
    setUser(updated);
  };

  if (!user) return null;

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Profile')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-800 flex-1">Edit Profile</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg overflow-hidden">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowCamera(true)}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                disabled
                className="mt-1 bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">Name cannot be changed here</p>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                disabled
                className="mt-1 bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed here</p>
            </div>

            <div>
              <Label>Bio</Label>
              <Input
                value={form.bio}
                onChange={(e) => setForm({...form, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <span className="font-medium">{user?.userRole || 'Member'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Chapter</span>
            <span className="font-medium">{user?.chapterName || 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Country</span>
            <span className="font-medium">{user?.country || 'Not set'}</span>
          </div>
        </CardContent>
      </Card>

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