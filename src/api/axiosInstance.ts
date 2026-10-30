import axios from 'axios';

// Use the configured backend in production and localhost during development.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = configuredApiBaseUrl
    ? configuredApiBaseUrl.replace(/\/+$/, '')
    : import.meta.env.DEV
    ? 'http://localhost:8080'
    : '';

// Key used to store auth data per browser tab
const TOKEN_KEY = 'smartstock_auth';

// Create Axios instance with defaults
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // 10 second timeout — fail fast if backend is down
    timeout: 10000,
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────
// Runs BEFORE every request
// Automatically attaches JWT token to Authorization header
// You write this once — never repeat in every API call

axiosInstance.interceptors.request.use(
    (config) => {
        const raw = sessionStorage.getItem(TOKEN_KEY);
        if (raw) {
            try {
                const auth = JSON.parse(raw);
                if (auth.token) {
                    config.headers.Authorization = `Bearer ${auth.token}`;
                }
            } catch {
                // Corrupt session data — ignore
                sessionStorage.removeItem(TOKEN_KEY);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────
// Runs AFTER every response
// 401 = token expired → clear storage → redirect to login
// This handles session expiry automatically

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.endsWith('/auth/login');
        if (error.response?.status === 401 && !isLoginRequest) {
            sessionStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { TOKEN_KEY };