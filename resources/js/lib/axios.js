import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL
    || (typeof window !== 'undefined' ? window.location.origin : undefined);

const instance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
});

export default instance;
