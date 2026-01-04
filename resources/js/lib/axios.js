import axios from 'axios';

/*
|--------------------------------------------------------------------------
| Axios Global Configuration
|--------------------------------------------------------------------------
|
| This configuration is REQUIRED for Laravel Sanctum SPA authentication.
| It enables cookie-based auth and CSRF protection.
|
*/

axios.defaults.baseURL = ''; // same domain (Laravel backend)
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

/*
|--------------------------------------------------------------------------
| Response Interceptor (Optional but Recommended)
|--------------------------------------------------------------------------
|
| Central place to handle auth errors (401, 419, etc.)
|
*/

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            console.warn('Unauthenticated');
        }

        if (error.response?.status === 419) {
            console.warn('CSRF token mismatch');
        }

        return Promise.reject(error);
    }
);

export default axios;
