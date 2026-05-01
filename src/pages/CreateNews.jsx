import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { AnimatePresence, motion } from 'framer-motion';
import CameraCapture from '@/components/CameraCapture';

export default function CreateNews() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    image: '',
    eventDate: '',
    isGlobal: false
  });
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    
    await base44.entities.NewsPost.create({
      ...form,
      chapterId: form.isGlobal ? null : user?.chapterId,
      chapterName: form.isGlobal ? null : user?.chapterName,
      country: user?.country
    });

    setSaving(false);
    window.location.href = createPageUrl('News');
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean']
    ]
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('News')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-800 flex-1">Create News Article</h1>
        <Button 
          onClick={handleSave} 
          disabled={!form.title || !form.content || saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Article Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder="Enter article title..."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Featured Image</Label>
            {form.image ? (
              <div className="mt-1 relative">
                <img src={form.image} alt="" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={() => setForm({...form, image: ''})}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCamera(true)}
                className="w-full mt-1"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            )}
          </div>

          <div>
            <Label>Event Date (optional)</Label>
            <Input
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm({...form, eventDate: e.target.value})}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Post Globally</Label>
            <Switch
              checked={form.isGlobal}
              onCheckedChange={(v) => setForm({...form, isGlobal: v})}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Article Content *</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactQuill
            value={form.content}
            onChange={(content) => setForm({...form, content})}
            modules={modules}
            placeholder="Write your article content here..."
            className="bg-white"
          />
        </CardContent>
      </Card>

      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onCapture={(url) => setForm({...form, image: url})}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}