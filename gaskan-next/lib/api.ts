import axios from 'axios';

const getBaseUrl = () => {
  const envApi = process.env.NEXT_PUBLIC_API_BASE;
  if (typeof window !== 'undefined') {
    // Leverage Next.js relative route proxy in client browser
    return '/api';
  }
  return envApi || '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      if (!config.baseURL) {
        config.baseURL = getBaseUrl();
      }

      // Guard against double /api/api/ prefixing if a caller passes '/api/...'
      if (config.url && config.url.startsWith('/api/')) {
        config.url = config.url.substring(4);
      }

      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['X-Session-Id'] = token;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: any, fallbackMsg: string = 'Terjadi kesalahan'): string {
  if (!err) return fallbackMsg;
  const data = err.response?.data;
  if (!data) return err.message || fallbackMsg;

  if (data.errors) {
    if (typeof data.errors === 'string') {
      return data.errors;
    }
    if (Array.isArray(data.errors)) {
      return data.errors.map((e: any) => (typeof e === 'string' ? e : e.message || JSON.stringify(e))).join(', ');
    }
    if (typeof data.errors === 'object') {
      const messages: string[] = [];
      Object.keys(data.errors).forEach((key) => {
        const val = data.errors[key];
        if (Array.isArray(val)) {
          messages.push(...val.map(String));
        } else if (typeof val === 'string') {
          messages.push(val);
        }
      });
      if (messages.length > 0) {
        return messages.join(', ');
      }
    }
  }

  if (typeof data.message === 'string' && data.message.trim() !== '') {
    return data.message;
  }

  if (typeof data.error === 'string' && data.error.trim() !== '') {
    return data.error;
  }

  return fallbackMsg;
}

export { api };
export default api;
