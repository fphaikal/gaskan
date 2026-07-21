'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
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

export default function PublicTeamPage() {
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
    <div className="min-h-screen flex flex-col bg-background text-foreground animate-in fade-in duration-500">
      {/* Public Landing Navbar */}
      <LandingNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-12">
        {/* Top Header */}
        <div className="text-center space-y-3 pt-6">
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
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon icon={group.icon} className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground">{group.title}</h2>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {group.title === 'Pembimbing' ? 'Pembimbing dan penanggung jawab proyek GASKAN.' : 'Anggota tim pengembang dan pembuat sistem GASKAN.'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                    {group.members.length} Orang
                  </Badge>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.members.map((member: any) => {
                    const photo = resolvePhoto(member.photoUrl);
                    const socmedList = getSocmed(member);

                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="bg-card rounded-2xl border border-border hover:border-primary/40 p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer space-y-3 group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                              {photo && !photo.includes('0000') ? (
                                <img src={photo} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <Icon icon="mingcute:user-4-fill" className="text-2xl text-primary/60" />
                              )}
                            </div>
                            {member.year && (
                              <Badge variant="outline" className="text-[9px] font-black text-muted-foreground">
                                {member.year}
                              </Badge>
                            )}
                          </div>

                          <div className="text-left space-y-1">
                            <h3 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {member.name}
                            </h3>
                            <p className={`text-[11px] sm:text-xs font-semibold ${roleColor(member.role).split(' ')[0]}`}>
                              {member.role || 'Anggota Tim'}
                            </p>
                            {member.bio && (
                              <p className="text-[10px] text-muted-foreground/70 italic line-clamp-2 leading-relaxed mt-1">
                                "{member.bio}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Social Links */}
                        {socmedList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                            {socmedList.map((s, idx) => (
                              <a
                                key={idx}
                                href={s.link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10 text-xs"
                              >
                                <Icon icon={s.icon} className="text-sm" />
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
      </main>

      {/* MEMBER DETAIL MODAL */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="sm:max-w-md p-6 sm:p-8 rounded-[2.5rem] bg-card border border-border space-y-5 relative overflow-hidden">
            {/* Header Decorative Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />

            <DialogHeader className="p-0 border-none bg-transparent text-center space-y-3 relative z-10 pt-2">
              {/* Large Avatar Frame with Glowing Siluet Border */}
              <div className="w-28 h-28 rounded-3xl bg-primary/10 border-2 border-primary/40 shadow-2xl shadow-primary/20 flex items-center justify-center mx-auto overflow-hidden shrink-0">
                {resolvePhoto(selectedMember.photoUrl) && !resolvePhoto(selectedMember.photoUrl)?.includes('0000') ? (
                  <img src={resolvePhoto(selectedMember.photoUrl)!} alt={selectedMember.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon icon="mingcute:user-4-fill" className="text-5xl text-primary/60" />
                )}
              </div>

              {/* Name & Role */}
              <div>
                <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
                  {selectedMember.name}
                </DialogTitle>
                <p className={`text-sm font-bold mt-1 ${roleColor(selectedMember.role).split(' ')[0]}`}>
                  {selectedMember.role || 'Anggota Tim'}
                </p>
              </div>

              {/* Period Badge */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-bold text-muted-foreground">
                  <Icon icon="mingcute:time-line" className="text-primary text-sm" />
                  <span>Periode {selectedMember.year || '2023 - Sekarang'}</span>
                </div>
              </div>
            </DialogHeader>

            {/* Bio Quote Box */}
            {selectedMember.bio && (
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed text-left italic relative">
                <Icon icon="mingcute:quote-left-fill" className="text-primary/20 text-xl absolute top-2 left-2 pointer-events-none" />
                <p className="relative z-10 pl-4 font-medium">{selectedMember.bio}</p>
              </div>
            )}

            {/* Social & Custom Links Section */}
            <div className="pt-3 border-t border-border space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">
                MEDIA SOSIAL & TAUTAN CUSTOM
              </p>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {selectedMember.github && (
                  <a
                    href={selectedMember.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border transition-all font-bold text-xs text-foreground group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                      <Icon icon="mdi:github" className="text-lg" />
                    </div>
                    <span className="flex-1 text-left truncate">GitHub</span>
                    <Icon icon="mingcute:external-link-line" className="text-sm text-muted-foreground/50 group-hover:text-foreground" />
                  </a>
                )}

                {selectedMember.linkedin && (
                  <a
                    href={selectedMember.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border transition-all font-bold text-xs text-foreground group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-sky-400 transition-colors">
                      <Icon icon="entypo-social:linkedin-with-circle" className="text-lg" />
                    </div>
                    <span className="flex-1 text-left truncate">LinkedIn</span>
                    <Icon icon="mingcute:external-link-line" className="text-sm text-muted-foreground/50 group-hover:text-foreground" />
                  </a>
                )}

                {selectedMember.instagram && (
                  <a
                    href={selectedMember.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border transition-all font-bold text-xs text-foreground group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-rose-400 transition-colors">
                      <Icon icon="mage:instagram-circle" className="text-lg" />
                    </div>
                    <span className="flex-1 text-left truncate">Instagram</span>
                    <Icon icon="mingcute:external-link-line" className="text-sm text-muted-foreground/50 group-hover:text-foreground" />
                  </a>
                )}

                {parseCustomLinks(selectedMember.customLinks).map((link: any, idx: number) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border transition-all font-bold text-xs text-foreground group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-primary transition-colors">
                      <Icon icon={link.icon || 'mingcute:link-2-line'} className="text-lg" />
                    </div>
                    <span className="flex-1 text-left truncate">{link.label || 'Tautan Custom'}</span>
                    <Icon icon="mingcute:external-link-line" className="text-sm text-muted-foreground/50 group-hover:text-foreground" />
                  </a>
                ))}

                {!selectedMember.github &&
                  !selectedMember.linkedin &&
                  !selectedMember.instagram &&
                  parseCustomLinks(selectedMember.customLinks).length === 0 && (
                    <p className="text-xs text-muted-foreground/50 italic text-center py-2 font-medium">
                      Tidak ada tautan kontak tambahan
                    </p>
                  )}
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => setSelectedMember(null)}
              className="w-full rounded-2xl font-bold text-xs h-10 opacity-70 hover:opacity-100"
            >
              Tutup
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Public Landing Footer */}
      <LandingFooter />
    </div>
  );
}
