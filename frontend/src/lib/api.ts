import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// withCredentials lets the browser send/receive the httpOnly auth cookie set
// by the backend — this is what keeps the session working across the
// Vercel <-> Render cross-site boundary.
export const api = axios.create({ baseURL, withCredentials: true });

// Attach Authorization header if a token exists in localStorage (dual support: cookie + header)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('achievedit_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a session expires (or the cookie is otherwise invalid) mid-use, the
// backend tells us via a 401 + code. Broadcast that as a DOM event so
// AuthContext can clear state and the UI can redirect to /login on its own,
// instead of the request just silently failing.
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
