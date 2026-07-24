'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Silakan masukkan email Anda');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Instruksi reset password telah dikirim ke email Anda');
    } catch (err: any) {
      console.warn('API forgot password error, using fallback:', err);
      setSubmitted(true);
      toast.success('Instruksi reset password telah dikirim ke email Anda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-y-auto overscroll-contain bg-background p-4 py-6 sm:p-6">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <div className="mb-2 flex items-center justify-center gap-2 sm:mb-4">
          <Icon icon="mingcute:key-2-fill" className="text-primary text-3xl" />
          <span className="text-2xl font-extrabold tracking-tight">GASKAN</span>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1 px-4 text-center sm:px-6">
            <CardTitle className="text-2xl font-bold">Lupa Password</CardTitle>
            <CardDescription>
              Masukkan email terdaftar untuk menerima link reset password
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {submitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-3xl">
                  <Icon icon="mingcute:mail-send-line" />
                </div>
                <h3 className="text-lg font-bold">Cek Email Anda</h3>
                <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  Kami telah mengirimkan instruksi pemulihan kata sandi ke <strong className="text-foreground">{email}</strong>.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setSubmitted(false)}
                >
                  Kirim ulang email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Icon icon="mingcute:mail-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@smtijogja.sch.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                  {isLoading && <Icon icon="mingcute:loading-3-line" className="animate-spin mr-2 text-lg" />}
                  {isLoading ? 'Mengirim...' : 'Kirim Instruksi Reset'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border px-4 pt-4 sm:px-6">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Icon icon="mingcute:arrow-left-line" />
              Kembali ke Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
