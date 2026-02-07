import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8000', // backend URL
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
});

export default instance;
