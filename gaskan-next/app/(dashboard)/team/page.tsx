'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const resolvePhoto = (url?: string) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/team/')) return `${API_BASE}${url}`;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const parseCustomLinks = (raw?: any) => {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
};

const roleColor = (roleStr?: string) => {
  if (!roleStr) return 'text-muted-foreground bg-muted/20 border-border';
  if (roleStr.includes('Backend')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  if (roleStr.includes('Frontend')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (roleStr.includes('Hardware') || roleStr.includes('Electrical') || roleStr.includes('Mechanical'))
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (roleStr.includes('Pembimbing')) return 'text-primary bg-primary/10 border-primary/20';
  return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
};

export default function TeamShowcasePage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/team').catch(() => null);
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data)) {
        setTeam(data.filter((m: any) => m.isActive !== false));
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const groupedTeam = useMemo(() => {
    const pembimbing: any[] = [];
    const pengembang: any[] = [];

    team.forEach((m) => {
      const isPembimbing = (m.role || '').toLowerCase().includes('pembimbing');
      if (isPembimbing) {
        pembimbing.push(m);
      } else {
        pengembang.push(m);
      }
    });

    pembimbing.sort((a, b) => (a.order || 0) - (b.order || 0));
    pengembang.sort((a, b) => (a.order || 0) - (b.order || 0));

    const res: any[] = [];
    if (pembimbing.length > 0) {
      res.push({
        title: 'Pembimbing',
        icon: 'mingcute:school-fill',
        members: pembimbing,
      });
    }
    if (pengembang.length > 0) {
      res.push({
        title: 'Tim Pengembang',
        icon: 'mingcute:code-fill',
        members: pengembang,
      });
    }
    return res;
  }, [team]);

  const getSocmed = (m: any) => {
    const socmed: any[] = [];
    if (m.instagram) socmed.push({ name: 'Instagram', link: m.instagram, icon: 'mingcute:ins-line' });
    if (m.linkedin) socmed.push({ name: 'LinkedIn', link: m.linkedin, icon: 'mingcute:linkedin-line' });
    if (m.github) socmed.push({ name: 'GitHub', link: m.github, icon: 'mingcute:github-line' });

    const custom = parseCustomLinks(m.customLinks);
    custom.forEach((item: any) => {
      if (item.url) {
        socmed.push({ name: item.label || 'Link', link: item.url, icon: item.icon || 'mingcute:link-2-line' });
      }
    });

    return socmed;
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full border border-primary/20">
          <Icon icon="mingcute:group-fill" className="text-base" />
          <span>Tim GASKAN</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          Orang-orang di Balik <span className="text-primary">GASKAN</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-xs sm:text-sm leading-relaxed font-semibold">
          Tim multidisiplin yang membangun dan menjaga sistem kehadiran digital SMTI Jogja.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
        </div>
      ) : groupedTeam.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-3xl border border-border text-muted-foreground/60 font-bold text-xs uppercase tracking-wider">
          Belum ada data anggota tim
        </div>
      ) : (
        <div className="space-y-12">
          {groupedTeam.map((group) => (
            <div key={group.title} className="space-y-6">
              {/* Group Title */}
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon icon={group.icon} className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">{group.title}</h2>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {group.members.length} Anggota Terdaftar
                  </p>
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {group.members.map((member: any) => {
                  const photo = resolvePhoto(member.photoUrl);
                  const socmedList = getSocmed(member);

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="bg-card rounded-3xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between cursor-pointer space-y-4 group"
                    >
                      <div className="space-y-4">
                        {/* Member Photo */}
                        <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                          {photo ? (
                            <img src={photo} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-black text-primary">{member.name?.charAt(0)}</span>
                          )}
                        </div>

                        {/* Name & Role */}
                        <div className="text-center space-y-1.5">
                          <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors truncate">
                            {member.name}
                          </h3>
                          <Badge className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${roleColor(member.role)}`}>
                            {member.role || 'Anggota Tim'}
                          </Badge>
                        </div>

                        {/* Bio */}
                        {member.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-2 text-center font-medium leading-relaxed">
                            {member.bio}
                          </p>
                        )}
                      </div>

                      {/* Social Links */}
                      {socmedList.length > 0 && (
                        <div className="pt-3 border-t border-border flex items-center justify-center gap-3">
                          {socmedList.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-xl hover:bg-primary/10"
                            >
                              <Icon icon={s.icon} className="text-lg" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MEMBER DETAIL MODAL */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border border-border space-y-6">
            <DialogHeader className="p-0 border-none bg-transparent text-center">
              <div className="w-28 h-28 mx-auto rounded-3xl overflow-hidden bg-muted border-2 border-primary/30 shrink-0 mb-3 shadow-md">
                {resolvePhoto(selectedMember.photoUrl) ? (
                  <img src={resolvePhoto(selectedMember.photoUrl)!} alt={selectedMember.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-primary">
                    {selectedMember.name?.charAt(0)}
                  </div>
                )}
              </div>

              <DialogTitle className="text-xl font-black text-foreground">
                {selectedMember.name}
              </DialogTitle>
              <div className="mt-1">
                <Badge className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${roleColor(selectedMember.role)}`}>
                  {selectedMember.role || 'Anggota Tim'}
                </Badge>
              </div>
            </DialogHeader>

            {selectedMember.bio && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground font-semibold leading-relaxed whitespace-pre-line text-center">
                "{selectedMember.bio}"
              </div>
            )}

            {/* Social Buttons */}
            {getSocmed(selectedMember).length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Kontak & Tautan</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {getSocmed(selectedMember).map((s, idx) => (
                    <a
                      key={idx}
                      href={s.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border text-xs font-bold transition-all"
                    >
                      <Icon icon={s.icon} className="text-base" />
                      <span>{s.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setSelectedMember(null)}
              className="w-full rounded-2xl font-bold text-xs h-10"
            >
              Tutup
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
