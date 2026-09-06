import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// withCredentials lets the browser send/receive cookies
export const api = axios.create({ baseURL, withCredentials: true });

// Attach Authorization header: Clerk session token (async) or localStorage fallback
api.interceptors.request.use(async (config) => {
  try {
    // Check if Clerk is loaded and active
    // @ts-ignore
    if (typeof window !== 'undefined' && window.Clerk?.session) {
      // @ts-ignore
      const clerkToken = await window.Clerk.session.getToken();
      if (clerkToken && config.headers) {
        config.headers.Authorization = `Bearer ${clerkToken}`;
        return config;
      }
    }
  } catch {
    // Ignore and fall back to localStorage
  }

  const token = localStorage.getItem('achievedit_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Broadcast 401 session-expired event
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const code = err.response?.data?.code;
    if (err.response?.status === 401 && (code === 'SESSION_EXPIRED' || code === 'INVALID_SESSION' || code === 'NO_SESSION')) {
      if (code === 'SESSION_EXPIRED' || code === 'INVALID_SESSION') {
        localStorage.removeItem('achievedit_token');
        window.dispatchEvent(new CustomEvent('achievedit:session-expired'));
      }
    }
    return Promise.reject(err);
  }
);
