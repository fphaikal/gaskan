<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { useThemeStore } from '~/store/useThemeStore';
import { storeToRefs } from 'pinia';

useSeoMeta({
  title: 'Dokumentasi Backend API | GASKAN',
  description: 'Dokumentasi Interaktif Resmi Backend API GASKAN SMK SMTI Yogyakarta',
});

const config = useRuntimeConfig();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const { role, userData } = storeToRefs(authStore);
const { isDark } = storeToRefs(themeStore);

const isDev = computed(() => role.value === 'developer');
const isAdmin = computed(() => role.value === 'admin' || isDev.value);
const isGuru = computed(() => role.value === 'guru');

// State
const isLoadingSpec = ref(true);
const spec = ref<any>(null);
const searchQuery = ref('');
const selectedTag = ref('ALL');
const activeEndpointKey = ref('');

// Execution state for "Try It Out"
const selectedServer = ref('');
const userToken = ref('');
const pathParams = ref<Record<string, string>>({});
const queryParams = ref<Record<string, string>>({});
const requestBodyJson = ref('');

const isExecuting = ref(false);
const executionResult = ref<{
  status: number | null;
  statusText: string;
  timeMs: number;
  headers: Record<string, string>;
  data: any;
  error: string | null;
} | null>(null);

const showTokenModal = ref(false);
const tokenInput = ref('');

// Fetch OpenAPI JSON spec from backend API
const fetchSpec = async () => {
  try {
    isLoadingSpec.value = true;
    const res = await $fetch<any>('/api/docs/openapi.json');
    spec.value = res;
    if (res?.servers?.length) {
      selectedServer.value = res.servers[0].url;
    }
    // Set default active endpoint
    const firstKey = getFlattenedEndpoints.value[0]?.key || '';
    if (firstKey) selectEndpoint(firstKey);
  } catch (err) {
    console.error('Failed to load OpenAPI spec:', err);
  } finally {
    isLoadingSpec.value = false;
  }
};

onMounted(() => {
  // Sync token from authStore / cookie / localStorage
  const storedToken = useCookie('auth_token').value || localStorage.getItem('token') || '';
  userToken.value = storedToken;
  tokenInput.value = storedToken;
  fetchSpec();
});

// Method badge color map
const methodBadge = (method: string) => {
  const m = method.toUpperCase();
  switch (m) {
    case 'GET': return { label: 'GET', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
    case 'POST': return { label: 'POST', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
    case 'PUT': return { label: 'PUT', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
    case 'PATCH': return { label: 'PATCH', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
    case 'DELETE': return { label: 'DELETE', bg: 'bg-rose-500/10 text-rose-500 border-rose-500/30' };
    default: return { label: m, bg: 'bg-base-200 text-base-content/60 border-base-300' };
  }
};

// Flatten paths into structured endpoints
const getFlattenedEndpoints = computed(() => {
  if (!spec.value || !spec.value.paths) return [];
  const list: any[] = [];

  Object.entries(spec.value.paths).forEach(([pathStr, pathItem]: [string, any]) => {
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
          security: operation.security || spec.value.security || []
        });
      }
    });
  });

  return list;
});

// Tags list
const availableTags = computed(() => {
  if (!spec.value?.tags) {
    const tags = new Set<string>();
    getFlattenedEndpoints.value.forEach(e => tags.add(e.tag));
    return Array.from(tags);
  }
  return spec.value.tags.map((t: any) => t.name);
});

// Filtered endpoints based on search and tag
const filteredEndpoints = computed(() => {
  let list = getFlattenedEndpoints.value;

  if (selectedTag.value !== 'ALL') {
    list = list.filter(e => e.tag === selectedTag.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(e =>
      e.path.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.tag.toLowerCase().includes(q)
    );
  }

  return list;
});

// Group filtered endpoints by tag for sidebar navigation
const groupedEndpoints = computed(() => {
  const map: Record<string, any[]> = {};
  filteredEndpoints.value.forEach(ep => {
    if (!map[ep.tag]) map[ep.tag] = [];
    map[ep.tag].push(ep);
  });
  return map;
});

// Selected active endpoint
const activeEndpoint = computed(() => {
  return getFlattenedEndpoints.value.find(e => e.key === activeEndpointKey.value) || getFlattenedEndpoints.value[0] || null;
});

const selectEndpoint = (key: string) => {
  activeEndpointKey.value = key;
  executionResult.value = null;
  pathParams.value = {};
  queryParams.value = {};
  requestBodyJson.value = '';

  const ep = getFlattenedEndpoints.value.find(e => e.key === key);
  if (ep) {
    // Populate default path parameters
    ep.parameters?.forEach((p: any) => {
      if (p.in === 'path') pathParams.value[p.name] = p.schema?.default || '';
      if (p.in === 'query') queryParams.value[p.name] = p.schema?.default !== undefined ? String(p.schema.default) : '';
    });

    // Populate request body sample if available
    if (ep.requestBody) {
      const content = ep.requestBody.content?.['application/json'];
      if (content?.schema) {
        requestBodyJson.value = JSON.stringify(generateSampleFromSchema(content.schema), null, 2);
      }
    }
  }
};

const generateSampleFromSchema = (schema: any): any => {
  if (!schema) return {};
  if (schema.$ref && spec.value?.components?.schemas) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    return generateSampleFromSchema(spec.value.components.schemas[refName]);
  }

  if (schema.type === 'object' && schema.properties) {
    const obj: any = {};
    Object.entries(schema.properties).forEach(([k, v]: [string, any]) => {
      if (v.example !== undefined) obj[k] = v.example;
      else if (v.type === 'string') obj[k] = 'example';
      else if (v.type === 'integer' || v.type === 'number') obj[k] = 1;
      else if (v.type === 'boolean') obj[k] = true;
      else if (v.type === 'array') obj[k] = [];
      else obj[k] = generateSampleFromSchema(v);
    });
    return obj;
  }
  return {};
};

// Generate cURL command
const curlCommand = computed(() => {
  if (!activeEndpoint.value) return '';
  const ep = activeEndpoint.value;
  let url = (selectedServer.value || config.public.apiBase || 'https://gaskan-api.smtijogja.my.id').replace(/\/+$/, '') + ep.path;

  // Substitute path params
  Object.entries(pathParams.value).forEach(([k, v]) => {
    if (v) url = url.replace(`{${k}}`, encodeURIComponent(v));
  });

  // Query params
  const qParts: string[] = [];
  Object.entries(queryParams.value).forEach(([k, v]) => {
    if (v) qParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  });
  if (qParts.length) url += `?${qParts.join('&')}`;

  let cmd = `curl -X ${ep.method} "${url}"`;
  cmd += ` \\\n  -H "Accept: application/json"`;

  if (userToken.value) {
    cmd += ` \\\n  -H "Authorization: Bearer ${userToken.value}"`;
  }

  if (['POST', 'PUT', 'PATCH'].includes(ep.method) && requestBodyJson.value) {
    cmd += ` \\\n  -H "Content-Type: application/json"`;
    cmd += ` \\\n  -d '${requestBodyJson.value.replace(/'/g, "'\\''")}'`;
  }

  return cmd;
});

// Execute request ("Try It Out")
const executeRequest = async () => {
  if (!activeEndpoint.value) return;
  const ep = activeEndpoint.value;
  const startMs = Date.now();

  try {
    isExecuting.value = true;
    executionResult.value = null;

    let url = ep.path;

    // Substitute path params
    Object.entries(pathParams.value).forEach(([k, v]) => {
      if (v) url = url.replace(`{${k}}`, encodeURIComponent(v));
    });

    const options: any = {
      method: ep.method,
      query: { ...queryParams.value }
    };

    if (['POST', 'PUT', 'PATCH'].includes(ep.method) && requestBodyJson.value) {
      try {
        options.body = JSON.parse(requestBodyJson.value);
      } catch (err) {
        alert('Format JSON Request Body tidak valid');
        isExecuting.value = false;
        return;
      }
    }

    const res: any = await $fetch.raw(url, options);
    const endMs = Date.now();

    const headersObj: Record<string, string> = {};
    if (res.headers) {
      res.headers.forEach((v: string, k: string) => {
        headersObj[k] = v;
      });
    }

    executionResult.value = {
      status: res.status || 200,
      statusText: res.statusText || 'OK',
      timeMs: endMs - startMs,
      headers: headersObj,
      data: res._data,
      error: null
    };
  } catch (err: any) {
    const endMs = Date.now();
    executionResult.value = {
      status: err?.status || err?.statusCode || 500,
      statusText: err?.statusText || 'Error',
      timeMs: endMs - startMs,
      headers: {},
      data: err?.data || null,
      error: err?.message || 'Gagal mengeksekusi request'
    };
  } finally {
    isExecuting.value = false;
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert('Berhasil disalin ke clipboard!');
};

const saveToken = () => {
  userToken.value = tokenInput.value.trim();
  if (userToken.value) {
    localStorage.setItem('gaskan_api_token', userToken.value);
  } else {
    localStorage.removeItem('gaskan_api_token');
  }
  showTokenModal.value = false;
};
</script>

<template>
  <div class="space-y-5 pb-12">
    
    <!-- PAGE HERO HEADER BANNER -->
    <div class="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div class="relative z-10 max-w-xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white/90 mb-2 border border-white/20">
          <Icon name="mingcute:code-fill" size="14" />
          Interactive API Explorer & OpenAPI 3.0 Spec
        </div>
        <h1 class="text-2xl sm:text-3xl font-black leading-tight">Dokumentasi Backend API</h1>
        <p class="text-xs sm:text-sm font-semibold text-white/80 mt-1.5 leading-relaxed">
          Gerbang Akses Pintar dan Kehadiran · SMK SMTI Yogyakarta
        </p>
      </div>

      <!-- Quick Action & Token Status -->
      <div class="relative z-10 flex flex-wrap items-center gap-3">
        <button @click="showTokenModal = true"
                class="btn bg-white hover:bg-white/90 text-orange-600 border-0 rounded-2xl font-black text-xs shadow-lg gap-2">
          <Icon name="mingcute:key-2-fill" size="16" />
          {{ userToken ? '🔑 Token Set' : '🔑 Set JWT Token' }}
        </button>

        <a :href="`${config.public.apiBase}/docs`" target="_blank"
           class="btn bg-black/20 hover:bg-black/30 text-white border border-white/20 rounded-2xl font-bold text-xs gap-1.5">
          Backend Direct UI ↗
        </a>
      </div>

      <div class="absolute -right-8 -bottom-12 opacity-10 pointer-events-none">
        <Icon name="mingcute:code-fill" size="240" />
      </div>
    </div>

    <!-- MAIN API EXPLORER LAYOUT -->
    <div v-if="!isLoadingSpec && spec" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT SIDEBAR: ENDPOINT LIST & SEARCH -->
      <div class="lg:col-span-4 bg-base-100 rounded-3xl p-5 border border-base-200/80 shadow-sm flex flex-col gap-4 max-h-[85vh] sticky top-20 overflow-hidden">
        
        <!-- Search & Filter Controls -->
        <div class="space-y-3 shrink-0">
          <div class="relative">
            <Icon name="mingcute:search-line" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input v-model="searchQuery"
                   type="text"
                   placeholder="Cari rute API / kata kunci..."
                   class="input input-sm w-full pl-8 rounded-xl bg-base-200/50 border-base-200 text-xs font-medium focus:border-orange-500" />
          </div>

          <!-- Tag Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[10px] font-bold">
            <button @click="selectedTag = 'ALL'"
                    :class="['px-2.5 py-1 rounded-xl whitespace-nowrap transition-all uppercase font-black', selectedTag === 'ALL' ? 'bg-orange-500 text-white shadow-sm' : 'bg-base-200/50 text-base-content/50 hover:text-base-content']">
              Semua Tag ({{ getFlattenedEndpoints.length }})
            </button>
            <button v-for="tag in availableTags" :key="tag"
                    @click="selectedTag = tag"
                    :class="['px-2.5 py-1 rounded-xl whitespace-nowrap transition-all uppercase font-black', selectedTag === tag ? 'bg-orange-500 text-white shadow-sm' : 'bg-base-200/50 text-base-content/50 hover:text-base-content']">
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- Grouped Endpoint List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 min-h-0">
          <div v-for="(group, tagGroup) in groupedEndpoints" :key="tagGroup" class="space-y-1.5">
            <div class="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-2 flex items-center justify-between">
              <span>{{ tagGroup }}</span>
              <span class="badge badge-xs bg-base-200 border-0 font-bold">{{ group.length }}</span>
            </div>

            <div v-for="ep in group" :key="ep.key"
                 @click="selectEndpoint(ep.key)"
                 :class="['p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1', activeEndpointKey === ep.key ? 'bg-orange-500/10 border-orange-500/40 shadow-sm' : 'bg-base-200/30 border-transparent hover:bg-base-200/60']">
              <div class="flex items-center gap-2">
                <span :class="['px-1.5 py-0.5 rounded-md text-[8px] font-black border font-mono', methodBadge(ep.method).bg]">
                  {{ ep.method }}
                </span>
                <span class="text-xs font-mono font-bold text-base-content truncate">{{ ep.path }}</span>
              </div>
              <p class="text-[10px] text-base-content/60 font-medium truncate px-0.5">{{ ep.summary }}</p>
            </div>
          </div>

          <div v-if="!filteredEndpoints.length" class="flex flex-col items-center justify-center py-12 opacity-30">
            <Icon name="mingcute:code-line" size="40" />
            <p class="text-[10px] font-black uppercase tracking-widest mt-2">Endpoint tidak ditemukan</p>
          </div>
        </div>

      </div>

      <!-- RIGHT MAIN PANEL: ENDPOINT DETAILS & TRY IT OUT RUNNER -->
      <div v-if="activeEndpoint" class="lg:col-span-8 space-y-6">
        
        <!-- Endpoint Overview Card -->
        <div class="bg-base-100 rounded-3xl p-6 border border-base-200/80 shadow-sm space-y-4">
          
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-base-200/60 pb-4">
            <div class="flex items-center gap-2.5">
              <span :class="['px-3 py-1 rounded-xl text-xs font-black border font-mono shadow-sm', methodBadge(activeEndpoint.method).bg]">
                {{ activeEndpoint.method }}
              </span>
              <span class="text-base sm:text-lg font-mono font-black text-base-content tracking-tight select-all">
                {{ activeEndpoint.path }}
              </span>
              <button @click="copyToClipboard(activeEndpoint.path)" class="btn btn-xs btn-ghost btn-circle text-base-content/40 hover:text-orange-500" title="Salin Path">
                <Icon name="mingcute:copy-2-line" size="14" />
              </button>
            </div>

            <div class="flex items-center gap-2">
              <span class="badge badge-sm bg-orange-500/10 text-orange-500 border-orange-500/20 font-black text-[10px] uppercase">
                {{ activeEndpoint.tag }}
              </span>
              <span v-if="activeEndpoint.security?.length" class="badge badge-sm bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[10px] uppercase gap-1">
                🔒 JWT Protected
              </span>
            </div>
          </div>

          <div>
            <h2 class="text-lg font-black text-base-content leading-snug">{{ activeEndpoint.summary }}</h2>
            <p v-if="activeEndpoint.description" class="text-xs text-base-content/70 font-medium leading-relaxed mt-1">
              {{ activeEndpoint.description }}
            </p>
          </div>

        </div>

        <!-- Request Parameters & Try It Out -->
        <div class="bg-base-100 rounded-3xl p-6 border border-base-200/80 shadow-sm space-y-5">
          
          <div class="flex items-center justify-between pb-3 border-b border-base-200/60">
            <h3 class="text-sm font-black text-base-content flex items-center gap-2">
              <Icon name="mingcute:play-fill" class="text-orange-500" size="16" />
              Uji Coba Request (Try It Out)
            </h3>

            <button @click="executeRequest"
                    :disabled="isExecuting"
                    class="btn btn-sm bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-2xl font-black gap-2 shadow-md">
              <span v-if="isExecuting" class="loading loading-spinner loading-xs"></span>
              <Icon v-else name="mingcute:send-fill" size="14" />
              {{ isExecuting ? 'Mengeksekusi...' : 'Kirim Request' }}
            </button>
          </div>

          <!-- Parameters Input Form -->
          <div v-if="activeEndpoint.parameters?.length" class="space-y-3">
            <h4 class="text-[10px] font-black uppercase tracking-widest text-base-content/40">Parameters</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-for="p in activeEndpoint.parameters" :key="p.name" class="space-y-1">
                <label class="text-xs font-bold text-base-content flex items-center justify-between">
                  <span>{{ p.name }} <span v-if="p.required" class="text-rose-500">*</span></span>
                  <span class="text-[9px] font-mono opacity-50 uppercase">{{ p.in }}</span>
                </label>
                <input v-if="p.in === 'path'"
                       v-model="pathParams[p.name]"
                       type="text"
                       :placeholder="`Nilai ${p.name}...`"
                       class="input input-sm w-full rounded-xl bg-base-200/50 border-base-200 text-xs font-mono" />
                <input v-else
                       v-model="queryParams[p.name]"
                       type="text"
                       :placeholder="`Nilai ${p.name}...`"
                       class="input input-sm w-full rounded-xl bg-base-200/50 border-base-200 text-xs font-mono" />
              </div>
            </div>
          </div>

          <!-- Request Body JSON Input -->
          <div v-if="['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method)" class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-base-content/40">Request Body (JSON)</h4>
              <span class="text-[10px] font-mono text-base-content/40">application/json</span>
            </div>
            <textarea v-model="requestBodyJson"
                      rows="6"
                      placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                      class="textarea w-full rounded-2xl bg-base-200/50 border-base-200 font-mono text-xs text-amber-500 focus:outline-none focus:border-orange-500"></textarea>
          </div>

          <!-- Generated cURL snippet -->
          <div class="space-y-2 pt-2 border-t border-base-200/60">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest text-base-content/40">Generated cURL Command</span>
              <button @click="copyToClipboard(curlCommand)" class="btn btn-xs btn-ghost text-orange-500 font-bold gap-1">
                <Icon name="mingcute:copy-2-line" size="12" />
                Salin cURL
              </button>
            </div>
            <pre class="p-3 bg-[#0d1117] text-gray-300 font-mono text-[11px] rounded-2xl overflow-x-auto border border-base-300 select-all leading-relaxed">{{ curlCommand }}</pre>
          </div>

        </div>

        <!-- EXECUTION RESULT PANEL -->
        <div v-if="executionResult" class="bg-base-100 rounded-3xl p-6 border border-base-200/80 shadow-sm space-y-4">
          
          <div class="flex items-center justify-between border-b border-base-200/60 pb-3">
            <div class="flex items-center gap-3">
              <h3 class="text-sm font-black text-base-content">Hasil Respon API</h3>
              <span :class="['px-2.5 py-1 rounded-xl text-xs font-black font-mono', executionResult.status && executionResult.status < 300 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30']">
                {{ executionResult.status || 'ERR' }} {{ executionResult.statusText }}
              </span>
              <span class="text-xs font-mono text-base-content/50 font-bold">{{ executionResult.timeMs }} ms</span>
            </div>

            <button @click="copyToClipboard(JSON.stringify(executionResult.data, null, 2))" class="btn btn-xs btn-ghost text-orange-500 font-bold gap-1">
              <Icon name="mingcute:copy-2-line" size="12" />
              Salin JSON Respon
            </button>
          </div>

          <!-- JSON Response View -->
          <div class="space-y-2">
            <pre class="p-4 bg-[#0d1117] text-amber-400 font-mono text-xs rounded-2xl overflow-x-auto border border-base-300 max-h-96 custom-scrollbar leading-relaxed">{{ JSON.stringify(executionResult.data, null, 2) }}</pre>
          </div>

        </div>

      </div>

    </div>

    <!-- Loading State -->
    <div v-else class="flex flex-col items-center justify-center py-24 opacity-40">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="text-xs font-black uppercase tracking-widest mt-3">Memuat Spesifikasi API Backend...</p>
    </div>

    <!-- JWT Token Modal -->
    <Teleport to="body">
      <dialog :class="['modal z-[999]', { 'modal-open': showTokenModal }]">
        <div class="modal-box bg-base-100 border border-base-200 p-6 rounded-3xl max-w-md shadow-2xl relative">
          <h3 class="font-black text-base text-base-content mb-4 flex items-center gap-2">
            🔑 Konfigurasi Token Authorization JWT
          </h3>
          
          <p class="text-xs text-base-content/60 font-medium mb-4 leading-relaxed">
            Masukkan token JWT Anda di bawah. Token ini akan secara otomatis disuntikkan pada setiap pengujian endpoint API ("Try It Out").
          </p>

          <div class="space-y-4">
            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">JWT Bearer Token</label>
              <textarea v-model="tokenInput" rows="4" placeholder="eyJhbGciOi..." class="textarea w-full rounded-2xl bg-base-200/50 border-base-200 font-mono text-xs text-amber-500 focus:outline-none focus:border-orange-500"></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-base-200/60">
              <button @click="showTokenModal = false" class="btn btn-xs rounded-xl font-bold">Batal</button>
              <button @click="saveToken" class="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl font-black">
                Simpan Token
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </Teleport>

  </div>
</template>
