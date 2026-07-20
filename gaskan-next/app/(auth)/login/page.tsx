'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState<{ message?: string; code?: number; canForce?: boolean } | null>(null);

  const performLogin = async (force: boolean = false) => {
    if (!identifier || !password) {
      toast.error('Silakan isi NIS / Email dan Password');
      return;
    }

    setIsLoading(true);
    setErrorData(null);

    // Payload containing both standard backend Zod keys (identifier, password)
    // and Nuxt legacy keys (NIS, Password, force) for maximum compatibility.
    const loginPayload = {
      identifier: identifier.trim(),
      password: password,
      NIS: identifier.trim(),
      Password: password,
      force: force,
    };

    try {
      let resData: any = null;

      try {
        const response = await api.post('/auth/login', loginPayload);
        resData = response.data;
      } catch (err1: any) {
        if (err1?.response?.status === 404 || !err1?.response) {
          const fallbackRes = await api.post('/login', loginPayload);
          resData = fallbackRes.data;
        } else {
          throw err1;
        }
      }

      const token =
        resData?.token ||
        resData?.data?.token ||
        resData?.sessionId ||
        resData?.access_token ||
        'session_' + Date.now();

      const userData = resData?.user || resData?.data?.user || resData?.data || {
        id: resData?.NIS || identifier,
        nis: resData?.NIS || identifier,
        name: resData?.Nama || resData?.name || identifier,
        role: (resData?.Kelas || resData?.role || 'siswa').toLowerCase(),
        email: identifier.includes('@') ? identifier : `${identifier}@smtijogja.sch.id`,
      };

      if (token && userData) {
        const formattedUser = {
          id: String(userData.id || userData.nis || identifier),
          name: userData.name || userData.nama || userData.Nama || identifier,
          email: userData.email || (identifier.includes('@') ? identifier : `${identifier}@smtijogja.sch.id`),
          role: String(userData.role || 'siswa').toLowerCase() as 'admin' | 'guru' | 'siswa',
          avatar: userData.photoUrl || userData.url_picture,
        };

        login(token, formattedUser);
        toast.success('Login berhasil! Selamat datang.');
        router.push('/home');
      } else {
        throw new Error('Respon login dari server tidak valid');
      }
    } catch (err: any) {
      console.error('[LOGIN] Error:', err);

      const errResponseData = err?.response?.data;
      const statusCode = err?.response?.status;
      
      let apiMessage = 'NIS/Email atau password yang Anda masukkan salah.';
      if (err?.code === 'ERR_NETWORK' || !err?.response) {
        apiMessage = 'Tidak dapat terhubung ke server backend (Network Error). Silakan periksa koneksi internet Anda.';
      } else if (errResponseData?.message) {
        apiMessage = errResponseData.message;
      } else if (errResponseData?.error) {
        apiMessage = errResponseData.error;
      } else if (errResponseData?.errors?.identifier) {
        apiMessage = errResponseData.errors.identifier[0];
      }

      const canForceLogin = statusCode === 400 || errResponseData?.code === 400 || errResponseData?.forceAvailable;

      setErrorData({
        message: apiMessage,
        code: statusCode,
        canForce: canForceLogin,
      });

      toast.error(apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(false);
  };

  const handleForceLogin = () => {
    performLogin(true);
  };

  return (
    <div className="min-h-screen flex items-stretch bg-background">
      {/* Left panel: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/10 border-r border-border relative overflow-hidden flex-col items-center justify-center p-12 gap-8">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 text-center space-y-6 max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Icon icon="mingcute:key-2-fill" className="text-3xl" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">GASKAN</span>
          </div>

          <h2 className="text-2xl font-bold leading-tight">
            Sistem Absensi Digital<br />
            <span className="text-primary">SMTI Jogja</span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Kelola dan pantau kehadiran siswa secara real-time dengan mudah, cepat, dan akurat.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="bg-card/80 rounded-xl p-3 border border-border">
              <p className="text-xl font-bold text-primary">500+</p>
              <p className="text-xs text-muted-foreground mt-0.5">Siswa</p>
            </div>
            <div className="bg-card/80 rounded-xl p-3 border border-border">
              <p className="text-xl font-bold text-primary">3</p>
              <p className="text-xs text-muted-foreground mt-0.5">Role</p>
            </div>
            <div className="bg-card/80 rounded-xl p-3 border border-border">
              <p className="text-xl font-bold text-primary">99.9%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <Icon icon="mingcute:key-2-fill" className="text-primary text-2xl" />
            <span className="text-xl font-extrabold">GASKAN</span>
          </div>

          <Card className="border-border shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
              <CardDescription>
                Masuk dengan NIS / Email dan password kamu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorData && (
                <div className="mb-4 p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Icon icon="mingcute:warning-fill" className="text-lg shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Login Gagal</p>
                      <p className="text-xs opacity-90 leading-snug">{errorData.message}</p>
                    </div>
                  </div>
                  {errorData.canForce && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleForceLogin}
                      className="bg-destructive/20 border-destructive/40 text-destructive hover:bg-destructive/30 font-bold shrink-0 text-xs"
                    >
                      Paksa Masuk
                    </Button>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nis">NIS / Email</Label>
                  <div className="relative">
                    <Icon icon="mingcute:user-4-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg pointer-events-none" />
                    <Input
                      id="nis"
                      type="text"
                      placeholder="Masukkan NIS / Email kamu"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Lupa Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Icon icon="mingcute:lock-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      <Icon icon={showPassword ? 'mingcute:eye-close-line' : 'mingcute:eye-line'} className="text-lg" />
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                  {isLoading && <Icon icon="mingcute:loading-3-line" className="animate-spin mr-2 text-lg" />}
                  {isLoading ? 'Memproses...' : 'Masuk ke GASKAN'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border pt-4">
              <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                ← Kembali ke halaman utama
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
