import axios from 'axios';

const envApiBaseUrl = import.meta.env.VITE_API_URL;

function isLocalHost(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

function resolveApiBaseUrl() {
    if (typeof window === 'undefined') {
        return envApiBaseUrl || undefined;
    }

    const browserOrigin = window.location.origin;
    if (!envApiBaseUrl) {
        return browserOrigin;
    }

    try {
        const configuredUrl = new URL(envApiBaseUrl);
        const currentUrl = new URL(browserOrigin);
        const bothLocal =
            isLocalHost(configuredUrl.hostname) &&
            isLocalHost(currentUrl.hostname);

        // For local development, enforce same-origin to keep cookies/session stable.
        return bothLocal ? browserOrigin : envApiBaseUrl;
    } catch {
        return envApiBaseUrl;
    }
}

const apiBaseUrl = resolveApiBaseUrl();

const instance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
});

export default instance;
