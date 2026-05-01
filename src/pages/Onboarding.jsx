import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, MapPin, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountryCombobox from '@/components/CountryCombobox';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [formData, setFormData] = useState({
    country: '',
    state: '',
    city: '',
    chapterId: '',
    chapterName: '',
    newChapterName: ''
  });

  useEffect(() => {
    loadChapters();
  }, [formData.country]);

  const loadChapters = async () => {
    if (!formData.country) return;
    const allChapters = await base44.entities.Chapter.filter({ country: formData.country });
    setChapters(allChapters);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let chapterId = formData.chapterId;
      let chapterName = formData.chapterName;

      // Create new chapter if needed
      if (formData.chapterId === 'new' && formData.newChapterName) {
        const newChapter = await base44.entities.Chapter.create({
          name: formData.newChapterName,
          country: formData.country,
          state: formData.state,
          city: formData.city
        });
        chapterId = newChapter.id;
        chapterName = formData.newChapterName;
      }

      await base44.auth.updateMe({
        country: formData.country,
        state: formData.state,
        city: formData.city,
        chapterId,
        chapterName,
        onboardingComplete: true,
        userRole: 'Member',
        membershipStatus: 'Active'
      });

      window.location.href = createPageUrl('Home');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">YEF</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Welcome to YEF Tracker</CardTitle>
          <CardDescription className="text-slate-500">Let's get you set up in just a moment</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Your Location</p>
                    <p className="text-sm text-slate-500">Where are you based?</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-700">Country *</Label>
                    <CountryCombobox
                      value={formData.country}
                      onChange={(v) => setFormData({ ...formData, country: v, chapterId: '', chapterName: '' })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-700">State / Province</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g., California"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-700">City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Los Angeles"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!formData.country}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Your Chapter</p>
                    <p className="text-sm text-slate-500">Join or create a local chapter</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-700">Select Chapter</Label>
                    <Select
                      value={formData.chapterId}
                      onValueChange={(v) => {
                        const chapter = chapters.find(c => c.id === v);
                        setFormData({ 
                          ...formData, 
                          chapterId: v, 
                          chapterName: chapter?.name || '' 
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose your chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                        <SelectItem value="new">+ Create New Chapter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.chapterId === 'new' && (
                    <div>
                      <Label className="text-slate-700">New Chapter Name</Label>
                      <Input
                        value={formData.newChapterName}
                        onChange={(e) => setFormData({ ...formData, newChapterName: e.target.value })}
                        placeholder="e.g., YEF Los Angeles"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading || (!formData.chapterId || (formData.chapterId === 'new' && !formData.newChapterName))}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Started'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}