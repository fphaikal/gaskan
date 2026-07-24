'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import type { PublicTeamMember } from '@/lib/team';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const roleColor = (roleStr?: string) => {
  if (!roleStr) return 'text-muted-foreground bg-muted/20 border-border';
  if (roleStr.includes('Backend')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  if (roleStr.includes('Frontend')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (roleStr.includes('Hardware') || roleStr.includes('Electrical') || roleStr.includes('Mechanical'))
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (roleStr.includes('Pembimbing')) return 'text-primary bg-primary/10 border-primary/20';
  return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
};

export function TeamPageClient({
  team,
}: {
  team: PublicTeamMember[];
}) {
  const [selectedMember, setSelectedMember] =
    useState<PublicTeamMember | null>(null);

  const groupedTeam = useMemo(() => {
    const pembimbing: PublicTeamMember[] = [];
    const pengembang: PublicTeamMember[] = [];

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

    const res: Array<{
      title: string;
      icon: string;
      members: PublicTeamMember[];
    }> = [];
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

  const getSocmed = (m: PublicTeamMember) => {
    const socmed: Array<{ name: string; link: string; icon: string }> = [];
    if (m.instagram) socmed.push({ name: 'Instagram', link: m.instagram, icon: 'mingcute:ins-line' });
    if (m.linkedin) socmed.push({ name: 'LinkedIn', link: m.linkedin, icon: 'mingcute:linkedin-line' });
    if (m.github) socmed.push({ name: 'GitHub', link: m.github, icon: 'mingcute:github-line' });

    m.customLinks.forEach((item) => {
      socmed.push({
        name: item.label || 'Link',
        link: item.url,
        icon: item.icon || 'mingcute:link-2-line',
      });
    });

    return socmed;
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground animate-in fade-in duration-500">
      {/* Public Landing Navbar */}
      <LandingNavbar />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 pb-12 pt-24 sm:space-y-12 sm:px-6 sm:pb-16">
        {/* Top Header */}
        <div className="space-y-3 text-center">
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

        {groupedTeam.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card px-4 py-12 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground/60 sm:py-16">
            Belum ada data anggota tim
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {groupedTeam.map((group) => (
              <div key={group.title} className="space-y-5 sm:space-y-6">
                {/* Section Header */}
                <div className="flex flex-col gap-3 border-b border-border pb-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon icon={group.icon} className="text-xl" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="break-words text-xl font-black text-foreground">{group.title}</h2>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {group.title === 'Pembimbing' ? 'Pembimbing dan penanggung jawab proyek GASKAN.' : 'Anggota tim pengembang dan pembuat sistem GASKAN.'}
                      </p>
                    </div>
                  </div>
                  <Badge className="w-fit shrink-0 bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                    {group.members.length} Orang
                  </Badge>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {group.members.map((member) => {
                    const photo = member.photoUrl;
                    const socmedList = getSocmed(member);

                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="group flex min-w-0 cursor-pointer flex-col justify-between space-y-3 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg motion-safe:hover:-translate-y-1 sm:p-5"
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
                                rel="noopener noreferrer"
                                aria-label={s.name}
                                title={s.name}
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-11 w-11 items-center justify-center rounded-lg text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-9"
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
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-md flex max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          {/* Header Decorative Background & Profile Header */}
          <div className="relative p-6 pb-4 border-b border-border shrink-0 bg-card">
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-3 pt-2 text-center">
              {/* Large Avatar Frame */}
              <div className="mx-auto flex aspect-square h-auto w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-primary/40 bg-primary/10 shadow-2xl shadow-primary/20 sm:w-28">
                {selectedMember?.photoUrl ? (
                  <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon icon="mingcute:user-4-fill" className="text-5xl text-primary/60" />
                )}
              </div>

              {/* Name & Role */}
              <div>
                <DialogTitle className="break-words text-xl font-black text-foreground tracking-tight sm:text-2xl text-center">
                  {selectedMember?.name}
                </DialogTitle>
                <p className={`text-sm font-bold mt-1 ${roleColor(selectedMember?.role).split(' ')[0]}`}>
                  {selectedMember?.role || 'Anggota Tim'}
                </p>
              </div>

              {/* Period Badge */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-bold text-muted-foreground">
                  <Icon icon="mingcute:time-line" className="text-primary text-sm" />
                  <span>Periode {selectedMember?.year || '2023 - Sekarang'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
            {/* Bio Quote Box */}
            {selectedMember?.bio && (
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed text-left italic relative">
                <Icon icon="mingcute:quote-left-fill" className="text-primary/20 text-xl absolute top-2 left-2 pointer-events-none" />
                <p className="relative z-10 pl-4 font-medium">{selectedMember.bio}</p>
              </div>
            )}

            {/* Social & Custom Links Section */}
            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">
                MEDIA SOSIAL & TAUTAN CUSTOM
              </p>

              <div className="flex flex-col gap-2">
                {selectedMember?.github && (
                  <a
                    href={selectedMember.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                      <Icon icon="mingcute:github-line" className="text-lg" />
                    </div>
                    <span className="flex-1 text-left truncate">GitHub</span>
                    <Icon icon="mingcute:external-link-line" className="text-sm text-muted-foreground/50 group-hover:text-foreground" />
                  </a>
                )}

                {selectedMember?.linkedin && (
                  <a
                    href={selectedMember.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-sky-400 transition-colors">
                      <Icon icon="mingcute:linkedin-line" className="text-lg" />
                    </div>
                    <span className="flex-1 text-left truncate">LinkedIn</span>
                    <Icon icon="mingcute:external-link-line" className="text-sm text-muted-foreground/50 group-hover:text-foreground" />
                  </a>
                )}

                {selectedMember?.instagram && (
                  <a
                    href={selectedMember.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-rose-400 transition-colors">
                      <Icon icon="mingcute:ins-line" className="text-lg" />
                    </div>
                    <span className="flex-1 text-left truncate">Instagram</span>
                    <Icon icon="mingcute:external-link-line" className="text-sm text-muted-foreground/50 group-hover:text-foreground" />
                  </a>
                )}

                {selectedMember?.customLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-primary transition-colors">
                      <Icon icon={link.icon || 'mingcute:link-2-line'} className="text-lg" />
                    </div>
                    <span className="flex-1 text-left truncate">{link.label || 'Tautan Custom'}</span>
                    <Icon icon="mingcute:external-link-line" className="text-sm text-muted-foreground/50 group-hover:text-foreground" />
                  </a>
                ))}

                {!selectedMember?.github &&
                  !selectedMember?.linkedin &&
                  !selectedMember?.instagram &&
                  (!selectedMember?.customLinks || selectedMember.customLinks.length === 0) && (
                    <p className="text-xs text-muted-foreground/50 italic text-center py-2 font-medium">
                      Tidak ada tautan kontak tambahan
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="p-4 pt-3 border-t border-border shrink-0 bg-card/90 backdrop-blur-md">
            <Button
              variant="ghost"
              onClick={() => setSelectedMember(null)}
              className="h-11 w-full rounded-2xl text-xs font-bold"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Public Landing Footer */}
      <LandingFooter />
    </div>
  );
}
