'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://gaskan-api.smtijogja.my.id';

const fallbackSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GASKAN - Gerbang Akses Pintar dan Kehadiran API',
    version: '1.0.0',
    description: 'Dokumentasi Terproteksi Resmi Backend API GASKAN (SMK SMTI Yogyakarta).'
  },
  servers: [
    { url: API_BASE, description: 'Production API Server' },
    { url: 'http://localhost:5000', description: 'Local Development Server' }
  ],
  tags: [
    { name: 'Auth', description: 'Otentikasi & Token Management' },
    { name: 'Presensi & Kehadiran', description: 'Scan Wajah & Log Absensi' },
    { name: 'Kalender Akademik', description: 'Hari Efektif, Fakultatif, Libur, & Ujian' },
    { name: 'Siswa & User', description: 'Manajemen Data Siswa' },
    { name: 'Kelas & Semester', description: 'Struktur Kelas & Jurusan' },
    { name: 'Surat Izin', description: 'Pengajuan Surat Izin/Sakit' },
    { name: 'Perangkat & Hikvision', description: 'Webhook Perangkat Gate' },
    { name: 'Dashboard & Sistem', description: 'Statistik & Metrik Server' }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login Pengguna (Siswa/Guru/Admin/Developer)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  login: { type: 'string', example: 'admin@smtijogja.sch.id' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/me': {
      get: { tags: ['Auth'], summary: 'Ambil Profil Pengguna Terautentikasi' }
    },
    '/api/dashboard/stats': {
      get: { tags: ['Dashboard & Sistem'], summary: 'Ambil Ringkasan Statistik Dashboard & Rekap Absensi' }
    },
    '/api/academic-events': {
      get: { tags: ['Kalender Akademik'], summary: 'Ambil Daftar Agenda Akademik (Terfilter Sesuai Class/Major)' },
      post: { tags: ['Kalender Akademik'], summary: 'Buat Agenda Akademik Baru (Admin/Guru/Developer)' }
    },
    '/api/academic-events/{id}': {
      get: { tags: ['Kalender Akademik'], summary: 'Detail Agenda Akademik Berdasarkan ID' },
      put: { tags: ['Kalender Akademik'], summary: 'Perbarui Agenda Akademik' },
      delete: { tags: ['Kalender Akademik'], summary: 'Hapus Agenda Akademik' }
    },
    '/api/attendance/today': {
      get: { tags: ['Presensi & Kehadiran'], summary: 'Ambil Data Absensi Siswa Hari Ini Per Kelas' }
    },
    '/api/log': {
      get: { tags: ['Presensi & Kehadiran'], summary: 'Log Rekap Kehadiran Harian (Grouped per Student-Day dengan Backend Pagination)' }
    },
    '/api/students': {
      get: { tags: ['Siswa & User'], summary: 'Daftar Siswa (Dengan Filter Kelas, Status, Search)' }
    },
    '/api/classes': {
      get: { tags: ['Kelas & Semester'], summary: 'Daftar Kelas Aktif SMTI Yogyakarta' }
    },
    '/api/leaves': {
      get: { tags: ['Surat Izin'], summary: 'Daftar Pengajuan Surat Izin/Sakit Siswa' },
      post: { tags: ['Surat Izin'], summary: 'Ajukan Surat Izin/Sakit Baru' }
    },
    '/api/system/metrics': {
      get: { tags: ['Dashboard & Sistem'], summary: 'Metrik Performa Server, Hardware, RAM, Disk & Network' }
    },
    '/api/device/webhook': {
      post: { tags: ['Perangkat & Hikvision'], summary: 'Webhook Events Real-time dari Mesin Scan Wajah Hikvision' }
    }
  }
};

export default function DocsApiPage() {
  const [isLoadingSpec, setIsLoadingSpec] = useState(true);
  const [spec, setSpec] = useState<any>(fallbackSpec);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [activeEndpointKey, setActiveEndpointKey] = useState('');
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>('list');

  const [selectedServer, setSelectedServer] = useState(API_BASE);
  const [userToken, setUserToken] = useState('');
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [requestBodyJson, setRequestBodyJson] = useState('');

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('gaskan_api_token') || localStorage.getItem('token') || '';
    setUserToken(token);
    setTokenInput(token);

    fetch(`${API_BASE}/api/docs/openapi.json`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.paths) {
          setSpec(data);
        }
      })
      .catch(() => {
        setSpec(fallbackSpec);
      })
      .finally(() => {
        setIsLoadingSpec(false);
      });
  }, []);

  const flattenedEndpoints = useMemo(() => {
    if (!spec || !spec.paths) return [];
    const list: any[] = [];
    Object.entries(spec.paths).forEach(([pathStr, pathItem]: [string, any]) => {
      Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
          const tag = operation.tags?.[0] || 'General';
          const key = `${method.toUpperCase()}:${pathStr}`;
          list.push({
            key,
            path: pathStr,
            method: method.toUpperCase(),
            summary: operation.summary || pathStr,
            description: operation.description || '',
            tag,
            parameters: operation.parameters || [],
            requestBody: operation.requestBody || null,
            responses: operation.responses || {},
          });
        }
      });
    });
    return list;
  }, [spec]);

  useEffect(() => {
    if (flattenedEndpoints.length > 0 && !activeEndpointKey) {
      setActiveEndpointKey(flattenedEndpoints[0].key);
    }
  }, [flattenedEndpoints, activeEndpointKey]);

  const availableTags = useMemo(() => {
    if (!spec?.tags) {
      const tags = new Set<string>();
      flattenedEndpoints.forEach((e) => tags.add(e.tag));
      return Array.from(tags);
    }
    return spec.tags.map((t: any) => t.name);
  }, [spec, flattenedEndpoints]);

  const filteredEndpoints = useMemo(() => {
    let list = flattenedEndpoints;
    if (selectedTag !== 'ALL') {
      list = list.filter((e) => e.tag === selectedTag);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.path.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.tag.toLowerCase().includes(q)
      );
    }
    return list;
  }, [flattenedEndpoints, selectedTag, searchQuery]);

  const groupedEndpoints = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredEndpoints.forEach((ep) => {
      if (!map[ep.tag]) map[ep.tag] = [];
      map[ep.tag].push(ep);
    });
    return map;
  }, [filteredEndpoints]);

  const activeEndpoint = useMemo(() => {
    return (
      flattenedEndpoints.find((e) => e.key === activeEndpointKey) ||
      flattenedEndpoints[0] ||
      null
    );
  }, [flattenedEndpoints, activeEndpointKey]);

  const selectEndpoint = (key: string) => {
    setActiveEndpointKey(key);
    setExecutionResult(null);
    setPathParams({});
    setQueryParams({});
    setRequestBodyJson('');

    const ep = flattenedEndpoints.find((e) => e.key === key);
    if (ep) {
      const initialPath: Record<string, string> = {};
      const initialQuery: Record<string, string> = {};
      ep.parameters?.forEach((p: any) => {
        if (p.in === 'path') initialPath[p.name] = p.schema?.default || '';
        if (p.in === 'query') initialQuery[p.name] = p.schema?.default !== undefined ? String(p.schema.default) : '';
      });
      setPathParams(initialPath);
      setQueryParams(initialQuery);

      if (ep.requestBody?.content?.['application/json']?.schema) {
        const schema = ep.requestBody.content['application/json'].schema;
        const sample: Record<string, any> = {};
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([k, v]: [string, any]) => {
            sample[k] = v.example !== undefined ? v.example : (v.type === 'string' ? 'string' : 1);
          });
        }
        setRequestBodyJson(JSON.stringify(sample, null, 2));
      }
    }

    setMobileTab('detail');
  };

  const methodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'POST':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
      case 'PUT':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const curlCommand = useMemo(() => {
    if (!activeEndpoint) return '';
    let url = selectedServer.replace(/\/+$/, '') + activeEndpoint.path;
    Object.entries(pathParams).forEach(([k, v]) => {
      if (v) url = url.replace(`{${k}}`, encodeURIComponent(v));
    });

    const qParts: string[] = [];
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v) qParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    });
    if (qParts.length) url += `?${qParts.join('&')}`;

    let cmd = `curl -X ${activeEndpoint.method} "${url}"`;
    cmd += ` \\\n  -H "Accept: application/json"`;
    if (userToken) cmd += ` \\\n  -H "Authorization: Bearer ${userToken}"`;
    if (['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method) && requestBodyJson) {
      cmd += ` \\\n  -H "Content-Type: application/json"`;
      cmd += ` \\\n  -d '${requestBodyJson.replace(/'/g, "'\\''")}'`;
    }
    return cmd;
  }, [activeEndpoint, selectedServer, pathParams, queryParams, userToken, requestBodyJson]);

  const executeRequest = async () => {
    if (!activeEndpoint) return;
    setIsExecuting(true);
    setExecutionResult(null);
    const startMs = Date.now();

    try {
      let url = selectedServer.replace(/\/+$/, '') + activeEndpoint.path;
      Object.entries(pathParams).forEach(([k, v]) => {
        if (v) url = url.replace(`{${k}}`, encodeURIComponent(v));
      });

      const qParts: string[] = [];
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v) qParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
      });
      if (qParts.length) url += `?${qParts.join('&')}`;

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method) && requestBodyJson) {
        headers['Content-Type'] = 'application/json';
        body = requestBodyJson;
      }

      const res = await fetch(url, {
        method: activeEndpoint.method,
        headers,
        body,
      });

      const data = await res.json().catch(() => null);
      const endMs = Date.now();

      setExecutionResult({
        status: res.status,
        statusText: res.statusText,
        timeMs: endMs - startMs,
        data,
      });
    } catch (err: any) {
      const endMs = Date.now();
      setExecutionResult({
        status: 500,
        statusText: 'Fetch Error',
        timeMs: endMs - startMs,
        data: { error: err?.message || 'Failed to connect to API server' },
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Berhasil disalin ke clipboard!');
  };

  const saveToken = () => {
    setUserToken(tokenInput.trim());
    if (tokenInput.trim()) {
      localStorage.setItem('gaskan_api_token', tokenInput.trim());
    } else {
      localStorage.removeItem('gaskan_api_token');
    }
    setShowTokenModal(false);
    toast.success('Token JWT disimpan');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="relative z-10">
          <Badge className="bg-white/15 text-white border-white/30 text-[10px] font-black uppercase tracking-widest mb-2">
            Interactive API Explorer & OpenAPI 3.0
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Dokumentasi Backend API</h1>
          <p className="text-xs sm:text-sm text-white/80 font-semibold mt-1">
            Gerbang Akses Pintar dan Kehadiran API · SMK SMTI Yogyakarta
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Button
            onClick={() => setShowTokenModal(true)}
            className="rounded-2xl font-black text-xs bg-white text-orange-600 hover:bg-white/90 shadow-md gap-2 h-11"
          >
            <Icon icon="mingcute:key-2-fill" className="text-base" />
            {userToken ? '🔑 Token Set' : '🔑 Set JWT Token'}
          </Button>

          <a
            href={`${API_BASE}/docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl font-bold text-xs bg-black/20 hover:bg-black/30 text-white border border-white/20 px-4 h-11 transition-all"
          >
            Direct UI ↗
          </a>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Endpoint List & Search */}
        <div className="lg:col-span-4 bg-card rounded-3xl p-5 border border-border shadow-sm space-y-4 lg:sticky lg:top-20">
          <div className="space-y-3">
            <div className="relative">
              <Icon icon="mingcute:search-line" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
              <Input
                type="text"
                placeholder="Cari rute API / kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-2xl h-10 bg-muted/40 font-semibold text-xs"
              />
            </div>

            {/* Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
              <button
                onClick={() => setSelectedTag('ALL')}
                className={`px-3 py-1 rounded-xl font-black transition-all whitespace-nowrap ${
                  selectedTag === 'ALL'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Semua ({flattenedEndpoints.length})
              </button>
              {availableTags.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-xl font-black transition-all whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Endpoints */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {Object.entries(groupedEndpoints).map(([tagGroup, items]) => (
              <div key={tagGroup} className="space-y-1.5">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider px-2">
                  {tagGroup} ({items.length})
                </h4>
                {items.map((ep: any) => {
                  const active = ep.key === activeEndpointKey;
                  return (
                    <button
                      key={ep.key}
                      onClick={() => selectEndpoint(ep.key)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 ${
                        active
                          ? 'bg-primary/10 border-primary/40 shadow-sm'
                          : 'bg-card border-border hover:border-primary/20'
                      }`}
                    >
                      <Badge className={`text-[9px] font-black px-2 py-0.5 border ${methodBadgeClass(ep.method)}`}>
                        {ep.method}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{ep.summary}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{ep.path}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Content: Active Endpoint Detail & Execution */}
        <div className="lg:col-span-8 bg-card rounded-3xl p-6 border border-border shadow-sm space-y-6">
          {activeEndpoint ? (
            <>
              {/* Endpoint Overview Header */}
              <div className="space-y-3 border-b border-border pb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={`text-xs font-black px-3 py-1 border ${methodBadgeClass(activeEndpoint.method)}`}>
                    {activeEndpoint.method}
                  </Badge>
                  <span className="font-mono text-base sm:text-lg font-black text-foreground">{activeEndpoint.path}</span>
                </div>
                <h2 className="text-xl font-black text-foreground">{activeEndpoint.summary}</h2>
                <p className="text-xs text-muted-foreground font-medium">{activeEndpoint.description || 'Tidak ada deskripsi tambahan.'}</p>
              </div>

              {/* cURL Command Generator */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-muted-foreground/60">Contoh Perintah cURL</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(curlCommand)}
                    className="h-8 text-xs font-bold text-primary gap-1"
                  >
                    <Icon icon="mingcute:copy-2-line" className="text-sm" />
                    Salin cURL
                  </Button>
                </div>
                <pre className="p-4 rounded-2xl bg-muted/50 border border-border font-mono text-xs text-foreground overflow-x-auto custom-scrollbar">
                  {curlCommand}
                </pre>
              </div>

              {/* Request Parameters Form */}
              {activeEndpoint.parameters?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-muted-foreground/60">Parameters (Path & Query)</h3>
                  <div className="space-y-2">
                    {activeEndpoint.parameters.map((p: any) => (
                      <div key={p.name} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-2xl bg-muted/30 border border-border">
                        <span className="font-mono text-xs font-black text-foreground sm:w-1/3">
                          {p.name} <span className="text-[10px] text-muted-foreground font-sans">({p.in})</span>
                        </span>
                        <Input
                          type="text"
                          placeholder={p.description || `Nilai ${p.name}`}
                          value={p.in === 'path' ? pathParams[p.name] || '' : queryParams[p.name] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (p.in === 'path') setPathParams((prev) => ({ ...prev, [p.name]: val }));
                            else setQueryParams((prev) => ({ ...prev, [p.name]: val }));
                          }}
                          className="rounded-xl h-9 bg-card text-xs font-medium sm:w-2/3"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Body JSON Editor */}
              {['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-muted-foreground/60">Request Body (JSON)</h3>
                  <textarea
                    rows={6}
                    value={requestBodyJson}
                    onChange={(e) => setRequestBodyJson(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-muted/50 border border-border font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 custom-scrollbar"
                  />
                </div>
              )}

              {/* Execute Action */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={executeRequest}
                  disabled={isExecuting}
                  className="rounded-2xl font-black text-xs bg-primary text-primary-foreground px-6 h-11 gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Icon icon="mingcute:play-fill" className="text-base" />
                  {isExecuting ? 'Mengeksekusi...' : 'Try It Out (Jalankan)'}
                </Button>
              </div>

              {/* Execution Result Output */}
              {executionResult && (
                <div className="space-y-3 pt-4 border-t border-border animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-muted-foreground/60">Hasil Respon API</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={executionResult.status < 400 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}>
                        {executionResult.status} {executionResult.statusText}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">{executionResult.timeMs} ms</span>
                    </div>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 custom-scrollbar border border-slate-800">
                    {JSON.stringify(executionResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              Pilih endpoint dari daftar di sebelah kiri untuk melihat rincian.
            </div>
          )}
        </div>
      </div>

      {/* Set JWT Token Modal */}
      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Icon icon="mingcute:key-2-fill" className="text-orange-500 text-xl" />
              Set Bearer Token JWT
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground font-medium">
              Masukkan token otentikasi JWT untuk mengakses endpoint terproteksi saat menjalankan &quot;Try It Out&quot;.
            </p>
            <textarea
              rows={4}
              placeholder="Bearer eyJhbGciOi..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full p-3 rounded-2xl bg-muted/40 border border-border font-mono text-xs text-foreground focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowTokenModal(false)}
              className="rounded-2xl font-bold text-xs h-10"
            >
              Batal
            </Button>
            <Button
              onClick={saveToken}
              className="rounded-2xl font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white px-5 h-10"
            >
              Simpan Token
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
