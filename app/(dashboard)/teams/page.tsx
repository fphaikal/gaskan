'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { goeyToast as toast } from 'goey-toast';
import { Icon } from '@/components/ui/icon';
import api, { extractErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

function DiscussionCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-5 sm:p-6 bg-card rounded-3xl border border-border shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-3/5 max-w-md" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="hidden sm:block h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DocsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="p-5 bg-card rounded-3xl border border-border shadow-sm space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-2/3" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-border">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkspaceTeamsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Memuat Workspace Teams" aria-busy="true">
      <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-8 w-full max-w-lg" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-border w-full sm:w-48">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Skeleton className="h-11 w-32 shrink-0 rounded-2xl sm:h-10" />
        <Skeleton className="h-11 w-40 shrink-0 rounded-2xl sm:h-10" />
        <Skeleton className="h-11 w-28 shrink-0 rounded-2xl sm:ml-auto sm:h-10" />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-16 rounded-xl shrink-0 sm:h-8" />
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-2xl sm:h-10 sm:w-32" />
        </div>
        <DiscussionCardsSkeleton />
      </div>
    </div>
  );
}

export default function WorkspaceTeamsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'discussions' | 'docs' | 'profile'>('discussions');

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
    name: '',
    role: '',
    bio: '',
    github: '',
    linkedin: '',
    instagram: '',
    email: '',
    customLinks: [] as any[],
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
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
          name: d.name || '',
          role: d.role || '',
          bio: d.bio || '',
          github: d.github || '',
          linkedin: d.linkedin || '',
          instagram: d.instagram || '',
          email: d.email || '',
          customLinks: typeof d.customLinks === 'string' ? JSON.parse(d.customLinks || '[]') : d.customLinks || [],
        });
        setProfilePhotoPreview(d.photoUrl || null);
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
    if (!newDiscussionForm.title.trim() || !newDiscussionForm.content.trim()) {
      toast.warning('Judul dan isi diskusi wajib diisi');
      return;
    }
    setSavingDiscussion(true);
    try {
      await api.post('/team-hub/discussions', newDiscussionForm);
      toast.success('Diskusi berhasil dipublikasikan!');
      setShowCreateDiscussionModal(false);
      setNewDiscussionForm({ title: '', content: '', category: 'General', pinned: false });
      await fetchDiscussions();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Gagal membuat diskusi'));
    } finally {
      setSavingDiscussion(false);
    }
  };

  const postCommentSubmit = async () => {
    if (!newCommentContent.trim() || !selectedDiscussion) {
      toast.warning('Komentar tidak boleh kosong');
      return;
    }
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
        await fetchDiscussions();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Gagal mengirim komentar'));
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
    if (!docForm.title.trim() || !docForm.content.trim()) {
      toast.warning('Judul dan isi dokumen wajib diisi');
      return;
    }
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
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Gagal menyimpan dokumen'));
    } finally {
      setSavingDoc(false);
    }
  };

  // Profile Handlers
  const saveMyProfileSubmit = async () => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      Object.keys(myProfileForm).forEach((key) => {
        if (key === 'customLinks') {
          formData.append('customLinks', JSON.stringify(myProfileForm.customLinks));
        } else {
          formData.append(key, (myProfileForm as any)[key]);
        }
      });
      if (profilePhotoFile) formData.append('photo', profilePhotoFile);

      await api.put('/team/my-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profil tim Anda berhasil diperbarui!');
      await fetchMyProfile();
    } catch {
      toast.error('Gagal memperbarui profil tim');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-500">
      {loadingProfile ? (
        <WorkspaceTeamsSkeleton />
      ) : !isTeamMember ? (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center bg-card p-8 rounded-3xl border border-border shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Icon icon="mingcute:lock-fill" className="text-3xl" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Akses Terbatas</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Halaman Workspace Teams khusus untuk anggota tim terdaftar GASKAN. Akun Anda belum terhubung sebagai anggota tim.
            </p>
            <Button className="w-full rounded-2xl font-bold bg-primary text-primary-foreground h-11" onClick={() => window.location.href = '/home'}>
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Header Banner matching Nuxt 1-to-1 */}
          <div className="bg-gradient-to-br from-primary/20 via-card to-background p-6 sm:p-8 rounded-3xl border border-primary/20 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-black">
                  <Icon icon="mingcute:group-fill" className="text-sm" />
                  <span>Workspace Teams GASKAN</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Platform Diskusi & Dokumentasi Tim
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl font-semibold">
                  Pusat kolaborasi internal anggota tim GASKAN untuk diskusi fitur, catatan teknis, dan dokumentasi proyek.
                </p>
              </div>

              {myTeamProfile && (
                <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border bg-card/80 p-3 backdrop-blur-md sm:w-auto sm:shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {myTeamProfile.photoUrl ? (
                      <img src={resolvePhoto(myTeamProfile.photoUrl) || ''} alt={myTeamProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon icon="mingcute:user-4-fill" className="text-primary text-xl" />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{myTeamProfile.name}</p>
                    <p className="text-[10px] text-primary font-bold truncate">{myTeamProfile.role}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs matching Nuxt 1-to-1 */}
          <div className="flex w-full max-w-full items-center gap-2 overflow-x-auto overscroll-x-contain border-b border-border pb-2">
            <Button
              variant={activeTab === 'discussions' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('discussions')}
              className="h-11 shrink-0 gap-2 rounded-2xl text-xs font-bold sm:h-10"
            >
              <Icon icon="mingcute:chat-3-fill" className="text-base" />
              <span>Diskusi Tim</span>
            </Button>
            <Button
              variant={activeTab === 'docs' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('docs')}
              className="h-11 shrink-0 gap-2 rounded-2xl text-xs font-bold sm:h-10"
            >
              <Icon icon="mingcute:book-2-fill" className="text-base" />
              <span>Dokumentasi Tim</span>
            </Button>
            {myTeamProfile && (
              <Button
                variant={activeTab === 'profile' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('profile')}
                className="h-11 shrink-0 gap-2 rounded-2xl text-xs font-bold sm:ml-auto sm:h-10"
              >
                <Icon icon="mingcute:user-setting-fill" className="text-base" />
                <span>Profil Saya</span>
              </Button>
            )}
          </div>

          {/* TAB 1: DISKUSI TIM */}
          {activeTab === 'discussions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex w-full max-w-full items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1">
                  {['', 'General', 'Announcement', 'Idea', 'Bug'].map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={discussionCategory === cat ? 'default' : 'outline'}
                      onClick={() => setDiscussionCategory(cat)}
                      className="h-11 shrink-0 rounded-xl text-xs font-bold sm:h-8"
                    >
                      {cat === '' ? 'Semua' : cat}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setShowCreateDiscussionModal(true)}
                  className="h-11 w-full gap-2 rounded-2xl bg-primary text-xs font-bold text-primary-foreground sm:w-auto"
                >
                  <Icon icon="mingcute:add-circle-fill" className="text-lg" />
                  <span>Buat Diskusi</span>
                </Button>
              </div>

              {loadingDiscussions ? (
                <DiscussionCardsSkeleton />
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
                      className="group min-w-0 cursor-pointer space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:p-6"
                    >
                      <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
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

                      <h3 className="break-words text-lg font-black text-foreground transition-colors group-hover:text-primary">
                        {d.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {d.content}
                      </p>

                      <div className="flex flex-col gap-3 border-t border-border pt-3 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
                            {d.author?.teamMember?.photoUrl || d.author?.photoUrl ? (
                              <img src={resolvePhoto(d.author?.teamMember?.photoUrl || d.author?.photoUrl) || ''} alt={d.author?.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{d.author?.name?.charAt(0)}</span>
                            )}
                          </div>
                          <span className="font-bold text-foreground">{d.author?.teamMember?.name || d.author?.name}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">• {d.author?.teamMember?.role || d.author?.role}</span>
                        </div>

                        <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-bold gap-1">
                          <Icon icon="mingcute:chat-1-line" />
                          <span>{d._count?.comments || 0} Komentar</span>
                        </Badge>
                      </div>
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
                <div className="flex w-full max-w-full items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1">
                  {['', 'Documentation', 'API', 'Hardware', 'Workflow', 'Guide'].map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={docCategory === cat ? 'default' : 'outline'}
                      onClick={() => setDocCategory(cat)}
                      className="h-11 shrink-0 rounded-xl text-xs font-bold sm:h-8"
                    >
                      {cat === '' ? 'Semua' : cat}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={openCreateDoc}
                  className="h-11 w-full gap-2 rounded-2xl bg-primary text-xs font-bold text-primary-foreground sm:w-auto"
                >
                  <Icon icon="mingcute:add-circle-fill" className="text-lg" />
                  <span>Buat Dokumen</span>
                </Button>
              </div>

              {loadingDocs ? (
                <DocsCardsSkeleton />
              ) : docs.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-3xl border border-border text-muted-foreground/50 italic text-xs">
                  Belum ada dokumen di kategori ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex min-w-0 flex-col justify-between space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 sm:p-5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-[9px] font-black uppercase">
                            {doc.category || 'Documentation'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDoc(doc)}
                            className="h-11 w-11 rounded-xl p-0 text-muted-foreground hover:text-primary sm:h-8 sm:w-8"
                            aria-label={`Edit ${doc.title}`}
                          >
                            <Icon icon="mingcute:pencil-fill" className="text-sm" />
                          </Button>
                        </div>
                        <h3 className="break-words text-base font-black text-foreground">{doc.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{doc.content}</p>
                      </div>

                      <div className="flex flex-col gap-1 border-t border-border pt-3 text-[10px] font-semibold text-muted-foreground min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                        <span className="break-words">Penulis: {doc.author?.teamMember?.name || doc.author?.name}</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFIL TIM SAYA */}
          {activeTab === 'profile' && myTeamProfile && (
            <div className="max-w-3xl space-y-6 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-8">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Icon icon="mingcute:user-setting-fill" className="text-primary text-2xl" />
                  <span>Pengaturan Profil Tim Saya</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                  Kelola informasi publik Anda yang tampil pada halaman Tim GASKAN.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Foto Profil Tim Section */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    FOTO PROFIL TIM
                  </Label>
                  <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-muted/30 p-4 min-[420px]:flex-row min-[420px]:items-center">
                    <div className="flex aspect-square h-auto w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted shadow-inner">
                      {profilePhotoPreview ? (
                        <img src={resolvePhoto(profilePhotoPreview) || ''} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="mingcute:user-4-fill" className="text-3xl text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="w-full min-w-0 flex-1 space-y-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProfilePhotoFile(file);
                            setProfilePhotoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="h-11 w-full rounded-xl bg-card text-xs font-bold sm:h-9"
                      />
                      <p className="text-[9px] font-semibold text-muted-foreground/60">
                        Pilih foto diri berkualitas (Max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nama Tampilan & Peran */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    NAMA TAMPILAN
                  </Label>
                  <Input
                    type="text"
                    value={myProfileForm.name}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, name: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    PERAN / SUB-ROLE
                  </Label>
                  <Input
                    type="text"
                    placeholder="Contoh: Frontend Developer"
                    value={myProfileForm.role}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, role: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                  />
                </div>

                {/* Bio Singkat (Full Width) */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    BIO SINGKAT
                  </Label>
                  <textarea
                    rows={2}
                    placeholder="Bio atau kata-kata motivasi singkat..."
                    value={myProfileForm.bio}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, bio: e.target.value })}
                    className="w-full rounded-2xl bg-muted/30 border border-border p-3 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* GitHub & LinkedIn */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    GITHUB URL
                  </Label>
                  <Input
                    type="text"
                    placeholder="https://github.com/..."
                    value={myProfileForm.github}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, github: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    LINKEDIN URL
                  </Label>
                  <Input
                    type="text"
                    placeholder="https://linkedin.com/in/..."
                    value={myProfileForm.linkedin}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, linkedin: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                  />
                </div>

                {/* Instagram & Email Kontak */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    INSTAGRAM URL
                  </Label>
                  <Input
                    type="text"
                    placeholder="https://instagram.com/..."
                    value={myProfileForm.instagram}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, instagram: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    EMAIL KONTAK
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={myProfileForm.email}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, email: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                  />
                </div>

                {/* Custom Links Section */}
                <div className="md:col-span-2 space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      TAUTAN CUSTOM
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setMyProfileForm({
                        ...myProfileForm,
                        customLinks: [...myProfileForm.customLinks, { label: '', url: '', icon: 'mingcute:link-2-line' }]
                      })}
                      className="h-11 gap-1 rounded-xl bg-primary text-[10px] font-bold text-primary-foreground sm:h-8"
                    >
                      <Icon icon="mingcute:add-line" />
                      <span>Tambah Link</span>
                    </Button>
                  </div>

                  <div className="space-y-2 bg-muted/20 p-3 rounded-2xl border border-border">
                    {myProfileForm.customLinks.map((link: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-[1fr_1fr_auto] min-[420px]:items-center">
                        <Input
                          type="text"
                          placeholder="Label (ex: Blog)"
                          value={link.label}
                          onChange={(e) => {
                            const updated = [...myProfileForm.customLinks];
                            updated[idx].label = e.target.value;
                            setMyProfileForm({ ...myProfileForm, customLinks: updated });
                          }}
                          className="h-11 rounded-xl bg-card text-xs font-bold min-[420px]:h-9"
                        />
                        <Input
                          type="text"
                          placeholder="URL (ex: https://...)"
                          value={link.url}
                          onChange={(e) => {
                            const updated = [...myProfileForm.customLinks];
                            updated[idx].url = e.target.value;
                            setMyProfileForm({ ...myProfileForm, customLinks: updated });
                          }}
                          className="h-11 rounded-xl bg-card text-xs font-bold min-[420px]:h-9"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = myProfileForm.customLinks.filter((_, i) => i !== idx);
                            setMyProfileForm({ ...myProfileForm, customLinks: updated });
                          }}
                          className="h-11 w-full rounded-xl text-rose-500 hover:text-rose-600 min-[420px]:w-11"
                          aria-label={`Hapus tautan ${link.label || idx + 1}`}
                        >
                          <Icon icon="mingcute:delete-2-line" className="text-base" />
                        </Button>
                      </div>
                    ))}
                    {myProfileForm.customLinks.length === 0 && (
                      <p className="text-xs text-muted-foreground/50 italic text-center py-2 font-medium">
                        Belum ada tautan custom
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button aligned to right */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveMyProfileSubmit}
                  disabled={savingProfile}
                  className="h-11 w-full rounded-2xl bg-primary px-8 text-xs font-black text-primary-foreground shadow-lg shadow-primary/20 sm:w-auto"
                >
                  {savingProfile ? (
                    <span className="flex items-center gap-2">
                      <Icon icon="mingcute:loading-fill" className="animate-spin text-base" />
                      Memproses...
                    </span>
                  ) : (
                    'Simpan Profil'
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DISKUSI */}
      {showCreateDiscussionModal && (
        <Dialog open={showCreateDiscussionModal} onOpenChange={setShowCreateDiscussionModal}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
            <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
              <DialogTitle className="text-xl font-black text-foreground">
                Buat Diskusi Baru
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Judul Diskusi</Label>
                </div>
                <Input
                  type="text"
                  placeholder="Judul topik diskusi..."
                  value={newDiscussionForm.title}
                  onChange={(e) => setNewDiscussionForm({ ...newDiscussionForm, title: e.target.value })}
                  className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Kategori</Label>
                </div>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Isi Diskusi</Label>
                </div>
                <textarea
                  rows={4}
                  placeholder="Tuliskan ide atau pertanyaan..."
                  value={newDiscussionForm.content}
                  onChange={(e) => setNewDiscussionForm({ ...newDiscussionForm, content: e.target.value })}
                  className="w-full resize-none rounded-2xl border border-border bg-muted/30 p-3 text-base font-bold focus:outline-none sm:text-xs"
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
              <Button variant="ghost" className="rounded-2xl font-bold flex-1 text-xs" onClick={() => setShowCreateDiscussionModal(false)}>
                Batal
              </Button>
              <Button onClick={createDiscussionSubmit} disabled={savingDiscussion} className="rounded-2xl font-bold flex-1 text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                {savingDiscussion ? 'Memproses...' : 'Publikasikan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DETAIL DISKUSI MODAL */}
      {selectedDiscussion && (
        <Dialog open={!!selectedDiscussion} onOpenChange={() => setSelectedDiscussion(null)}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-2xl">
            <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
              <DialogTitle className="break-words text-xl font-black text-foreground">
                {selectedDiscussion.title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-6">
              <p className="text-xs text-muted-foreground leading-relaxed p-4 bg-muted/30 rounded-2xl border border-border">
                {selectedDiscussion.content}
              </p>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground">Komentar ({selectedDiscussion.comments?.length || 0})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDiscussion.comments?.map((c: any) => (
                    <div key={c.id} className="p-3 bg-muted/20 rounded-xl border border-border text-xs space-y-1">
                      <p className="font-bold text-primary">{c.author?.teamMember?.name || c.author?.name}</p>
                      <p className="text-foreground">{c.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 pt-2 min-[420px]:flex-row">
                  <Input
                    type="text"
                    placeholder="Tulis komentar..."
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    className="h-11 rounded-xl text-xs font-bold"
                  />
                  <Button onClick={postCommentSubmit} disabled={submittingComment} className="h-11 w-full rounded-xl px-4 text-xs font-bold min-[420px]:w-auto">
                    Kirim
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
              <Button variant="ghost" className="rounded-2xl font-bold w-full text-xs" onClick={() => setSelectedDiscussion(null)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
