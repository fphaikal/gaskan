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

export { api };
export default api;
