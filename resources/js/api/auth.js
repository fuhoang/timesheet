import axios from '../lib/axios';

export async function csrf() {
    await axios.get('/sanctum/csrf-cookie'); // sets XSRF-TOKEN
}

export async function register(data) {
    await csrf();
    return axios.post('/register', data);
}

export async function login(credentials) {
    await csrf();
    return axios.post('/login', credentials);
}

export async function logout() {
    return axios.post('/logout');
}

export async function getUser() {
    const { data } = await axios.get('/api/user');
    return data;
}
