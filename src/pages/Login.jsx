import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        await base44.auth.signUpWithEmail(email, password, { name });
      } else {
        await base44.auth.loginWithEmail(email, password);
      }
      // After auth, Layout will route to onboarding if needed.
      window.location.href = createPageUrl('Home');
    } catch (err) {
      toast.error(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">YEF Evangelism Tracker</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signup' ? 'Create your account' : 'Sign in to continue'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-slate-500">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-500">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            {mode === 'signup' ? (
              <button className="text-blue-700" onClick={() => setMode('login')}>Already have an account? Sign in</button>
            ) : (
              <button className="text-blue-700" onClick={() => setMode('signup')}>New here? Create an account</button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
