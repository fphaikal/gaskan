'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/shared/CustomSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const resolvePhoto = (url?: string) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/team/')) return `${API_BASE}${url}`;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const categoryBadgeClass = (cat: string) => {
  if (cat === 'Announcement' || cat === 'Pengumuman') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  if (cat === 'Idea' || cat === 'Ide & Fitur') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (cat === 'Bug' || cat === 'Bug & Teknis') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  if (cat === 'API' || cat === 'Hardware') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  return 'bg-primary/10 text-primary border-primary/20';
};

export default function WorkspaceTeamsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'discussions' | 'docs' | 'profile'>('profile');

  // Team Access State
  const [myTeamProfile, setMyTeamProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Discussions State
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [discussionCategory, setDiscussionCategory] = useState('');
  const [showCreateDiscussionModal, setShowCreateDiscussionModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [newDiscussionForm, setNewDiscussionForm] = useState({
    title: '',
    content: '',
    category: 'General',
    pinned: false,
  });
  const [savingDiscussion, setSavingDiscussion] = useState(false);

  // Docs State
  const [docs, setDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docCategory, setDocCategory] = useState('');
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isEditingDoc, setIsEditingDoc] = useState(false);

  const [docForm, setDocForm] = useState({
    id: null as string | null,
    title: '',
    content: '',
    category: 'Documentation',
  });
  const [savingDoc, setSavingDoc] = useState(false);

  // My Profile Form State
  const [myProfileForm, setMyProfileForm] = useState({
    name: 'Fahreza Pasha Haikal',
    role: 'Frontend Developer',
    bio: '',
    github: 'https://github.com/fphaikal',
    linkedin: 'https://linkedin.com/in/fphaikal',
    instagram: '',
    email: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const isTeamMember = useMemo(() => {
    const r = (user?.role || '').toUpperCase();
    return r === 'ADMIN' || r === 'DEVELOPER' || !!myTeamProfile;
  }, [user, myTeamProfile]);

  const fetchMyProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await api.get('/team/my-profile').catch(() => null);
      if (res?.data?.data || res?.data) {
        const d = res?.data?.data || res?.data;
        setMyTeamProfile(d);
        setMyProfileForm({
          name: d.name || 'Fahreza Pasha Haikal',
          role: d.role || 'Frontend Developer',
          bio: d.bio || '',
          github: d.github || 'https://github.com/fphaikal',
          linkedin: d.linkedin || 'https://linkedin.com/in/fphaikal',
          instagram: d.instagram || '',
          email: d.email || '',
        });
      }
    } catch {
      // ignore non-linked profile
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const fetchDiscussions = useCallback(async () => {
    setLoadingDiscussions(true);
    try {
      const q = discussionCategory ? `?category=${encodeURIComponent(discussionCategory)}` : '';
      const res = await api.get(`/team-hub/discussions${q}`).catch(() => null);
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d)) setDiscussions(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDiscussions(false);
    }
  }, [discussionCategory]);

  const fetchDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const q = docCategory ? `?category=${encodeURIComponent(docCategory)}` : '';
      const res = await api.get(`/team-hub/docs${q}`).catch(() => null);
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d)) setDocs(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  }, [docCategory]);

  useEffect(() => {
    fetchMyProfile();
    fetchDiscussions();
    fetchDocs();
  }, [fetchMyProfile, fetchDiscussions, fetchDocs]);

  // Discussion Handlers
  const openDiscussionDetail = async (item: any) => {
    try {
      const res = await api.get(`/team-hub/discussions/${item.id}`);
      if (res?.data?.data || res?.data) {
        setSelectedDiscussion(res.data.data || res.data);
      }
    } catch {
      toast.error('Gagal memuat rincian diskusi');
    }
  };

  const createDiscussionSubmit = async () => {
    if (!newDiscussionForm.title || !newDiscussionForm.content) return;
    setSavingDiscussion(true);
    try {
      await api.post('/team-hub/discussions', newDiscussionForm);
      toast.success('Diskusi berhasil dipublikasikan!');
      setShowCreateDiscussionModal(false);
      setNewDiscussionForm({ title: '', content: '', category: 'General', pinned: false });
      await fetchDiscussions();
    } catch {
      toast.error('Gagal membuat diskusi');
    } finally {
      setSavingDiscussion(false);
    }
  };

  const postCommentSubmit = async () => {
    if (!newCommentContent.trim() || !selectedDiscussion) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/team-hub/discussions/${selectedDiscussion.id}/comments`, {
        content: newCommentContent,
      });
      const c = res?.data?.data || res?.data;
      if (c) {
        setSelectedDiscussion((prev: any) => ({
          ...prev,
          comments: [...(prev?.comments || []), c],
        }));
        setNewCommentContent('');
        toast.success('Komentar terkirim');
        fetchDiscussions();
      }
    } catch {
      toast.error('Gagal mengirim komentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Docs Handlers
  const openCreateDoc = () => {
    setIsEditingDoc(false);
    setDocForm({ id: null, title: '', content: '', category: 'Documentation' });
    setShowCreateDocModal(true);
  };

  const openEditDoc = (doc: any) => {
    setIsEditingDoc(true);
    setDocForm({ id: doc.id, title: doc.title, content: doc.content, category: doc.category || 'Documentation' });
    setShowCreateDocModal(true);
  };

  const saveDocSubmit = async () => {
    if (!docForm.title || !docForm.content) return;
    setSavingDoc(true);
    try {
      if (isEditingDoc && docForm.id) {
        await api.put(`/team-hub/docs/${docForm.id}`, docForm);
        toast.success('Dokumen diperbarui');
      } else {
        await api.post('/team-hub/docs', docForm);
        toast.success('Dokumen dibuat');
      }
      setShowCreateDocModal(false);
      await fetchDocs();
    } catch {
      toast.error('Gagal menyimpan dokumen');
    } finally {
      setSavingDoc(false);
    }
  };

  const saveMyProfileSubmit = async () => {
    setSavingProfile(true);
    try {
      await api.put('/team/my-profile', myProfileForm);
      toast.success('Profil tim Anda berhasil diperbarui!');
      await fetchMyProfile();
    } catch {
      toast.error('Gagal memperbarui profil tim');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-16 text-left animate-in fade-in duration-500">
      {loadingProfile ? (
        <div className="flex justify-center py-20">
          <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
        </div>
      ) : !isTeamMember ? (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center bg-card p-8 rounded-3xl border border-border shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Icon icon="mingcute:lock-fill" className="text-3xl" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Akses Terbatas</h2>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Halaman Workspace Teams khusus untuk anggota tim terdaftar GASKAN. Akun Anda belum terhubung sebagai anggota tim.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Tabs matching Nuxt Screenshot 1-to-1 */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('discussions')}
                className={`flex items-center gap-2 font-extrabold text-xs px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'discussions'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon icon="mingcute:chat-3-fill" className="text-base" />
                <span>Diskusi Tim</span>
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className={`flex items-center gap-2 font-extrabold text-xs px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'docs'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon icon="mingcute:book-2-fill" className="text-base" />
                <span>Dokumentasi Tim</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 font-extrabold text-xs px-5 py-2 rounded-full transition-all ${
                activeTab === 'profile'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="mingcute:user-setting-fill" className="text-base" />
              <span>Profil Saya</span>
            </button>
          </div>

          {/* TAB 1: DISKUSI TIM */}
          {activeTab === 'discussions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['', 'General', 'Announcement', 'Idea', 'Bug'].map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={discussionCategory === cat ? 'default' : 'outline'}
                      onClick={() => setDiscussionCategory(cat)}
                      className="rounded-xl font-bold text-xs h-8"
                    >
                      {cat === '' ? 'Semua' : cat}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setShowCreateDiscussionModal(true)}
                  className="rounded-2xl gap-2 font-bold text-xs bg-amber-400 text-black hover:bg-amber-500 h-10"
                >
                  <Icon icon="mingcute:add-circle-fill" className="text-lg" />
                  <span>Buat Diskusi</span>
                </Button>
              </div>

              {loadingDiscussions ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
                  <p className="text-xs font-bold">Memuat diskusi tim...</p>
                </div>
              ) : discussions.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-3xl border border-border text-muted-foreground/50 italic text-xs">
                  Belum ada diskusi di kategori ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {discussions.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => openDiscussionDetail(d)}
                      className="p-5 sm:p-6 bg-card rounded-3xl border border-border hover:border-amber-400/50 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${categoryBadgeClass(d.category)}`}>
                            {d.category}
                          </span>
                          {d.pinned && (
                            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[9px] font-black uppercase">
                              <Icon icon="mingcute:pin-fill" className="mr-1" /> Pinned
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {new Date(d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-foreground group-hover:text-amber-400 transition-colors">
                        {d.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {d.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOKUMENTASI TIM */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['', 'Documentation', 'API', 'Hardware', 'Workflow', 'Guide'].map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={docCategory === cat ? 'default' : 'outline'}
                      onClick={() => setDocCategory(cat)}
                      className="rounded-xl font-bold text-xs h-8"
                    >
                      {cat === '' ? 'Semua' : cat}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={openCreateDoc}
                  className="rounded-2xl gap-2 font-bold text-xs bg-amber-400 text-black hover:bg-amber-500 h-10"
                >
                  <Icon icon="mingcute:add-circle-fill" className="text-lg" />
                  <span>Buat Dokumen</span>
                </Button>
              </div>

              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
                  <p className="text-xs font-bold">Memuat dokumentasi tim...</p>
                </div>
              ) : docs.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-3xl border border-border text-muted-foreground/50 italic text-xs">
                  Belum ada dokumen di kategori ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 bg-card rounded-3xl border border-border hover:border-amber-400/50 shadow-sm transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <Badge className="bg-amber-400/15 text-amber-500 border-amber-400/30 text-[9px] font-black uppercase">
                          {doc.category || 'Documentation'}
                        </Badge>
                        <h3 className="text-lg font-black text-foreground">{doc.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {doc.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFIL SAYA (1-TO-1 MATCHING SCREENSHOT 1) */}
          {activeTab === 'profile' && (
            <div className="max-w-xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Icon icon="mingcute:user-setting-fill" className="text-amber-400 text-2xl" />
                <span>Pengaturan Profil Tim Saya</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Nama Lengkap</Label>
                  <Input
                    type="text"
                    value={myProfileForm.name}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, name: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/40 font-bold text-xs border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Role / Peran Tim</Label>
                  <Input
                    type="text"
                    placeholder="Frontend Developer"
                    value={myProfileForm.role}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, role: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/40 font-bold text-xs border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Bio / Deskripsi</Label>
                  <textarea
                    rows={4}
                    value={myProfileForm.bio}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, bio: e.target.value })}
                    className="w-full rounded-2xl bg-muted/40 border border-border p-3 font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">GitHub URL</Label>
                    <Input
                      type="text"
                      placeholder="https://github.com/fphaikal"
                      value={myProfileForm.github}
                      onChange={(e) => setMyProfileForm({ ...myProfileForm, github: e.target.value })}
                      className="rounded-2xl h-11 bg-muted/40 font-bold text-xs border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">LinkedIn URL</Label>
                    <Input
                      type="text"
                      placeholder="https://linkedin.com/in/fphaikal"
                      value={myProfileForm.linkedin}
                      onChange={(e) => setMyProfileForm({ ...myProfileForm, linkedin: e.target.value })}
                      className="rounded-2xl h-11 bg-muted/40 font-bold text-xs border-border"
                    />
                  </div>
                </div>

                <Button
                  onClick={saveMyProfileSubmit}
                  disabled={savingProfile}
                  className="w-full rounded-2xl font-extrabold text-sm bg-amber-400 text-black hover:bg-amber-500 h-12 shadow-md mt-6"
                >
                  {savingProfile ? 'Memproses...' : 'Simpan Perubahan Profil'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DISKUSI */}
      {showCreateDiscussionModal && (
        <Dialog open={showCreateDiscussionModal} onOpenChange={setShowCreateDiscussionModal}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border border-border">
            <DialogHeader className="p-0 border-none bg-transparent">
              <DialogTitle className="text-xl font-black text-foreground">
                Buat Diskusi Baru
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Judul Diskusi</Label>
                <Input
                  type="text"
                  placeholder="Judul topik diskusi..."
                  value={newDiscussionForm.title}
                  onChange={(e) => setNewDiscussionForm({ ...newDiscussionForm, title: e.target.value })}
                  className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Kategori</Label>
                <CustomSelect
                  options={[
                    { value: 'General', label: 'General' },
                    { value: 'Announcement', label: 'Pengumuman' },
                    { value: 'Idea', label: 'Ide & Fitur' },
                    { value: 'Bug', label: 'Bug & Teknis' },
                  ]}
                  value={newDiscussionForm.category}
                  onChange={(val) => setNewDiscussionForm({ ...newDiscussionForm, category: val })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Isi Diskusi</Label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan ide atau pertanyaan..."
                  value={newDiscussionForm.content}
                  onChange={(e) => setNewDiscussionForm({ ...newDiscussionForm, content: e.target.value })}
                  className="w-full rounded-2xl bg-muted/30 border border-border p-3 font-bold text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button variant="ghost" className="rounded-2xl font-bold text-xs" onClick={() => setShowCreateDiscussionModal(false)}>
                Batal
              </Button>
              <Button onClick={createDiscussionSubmit} disabled={savingDiscussion} className="rounded-2xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-500">
                Kirim Diskusi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
