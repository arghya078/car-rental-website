
import axios from 'axios';

let storeRef = null;

export function attachStore(store) {
  storeRef = store;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (storeRef) {
        try {
          
          storeRef.dispatch({ type: 'auth/logout' });
        } catch (e) {
          console.log(e);
        }
      }

      try {
        window.location.replace('/signin');
      } catch (e) {
        console.log(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
