import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:8000'; // your Laravel backend
axios.defaults.withCredentials = true;           // must be true for Sanctum cookies
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

export default axios;
