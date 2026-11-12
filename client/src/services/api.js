import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

/** Normalizes an axios error into { message, fields } for forms and toasts. */
export function getError(err) {
  const message =
    err?.response?.data?.message || err?.message || 'Something went wrong';
  const fields = {};
  if (Array.isArray(err?.response?.data?.errors)) {
    for (const e of err.response.data.errors) {
      if (e.field) fields[e.field] = e.message;
    }
  }
  return { message, fields };
}

// When the HTTP-only cookie expires mid-session, notify the app so the auth
// context can gracefully return the user to the login screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || '';
    const isAuthEndpoint = url.startsWith('/auth/');
    if (status === 401 && !isAuthEndpoint) {
      window.dispatchEvent(new CustomEvent('taskflow:unauthorized'));
    }
    return Promise.reject(err);
  }
);
