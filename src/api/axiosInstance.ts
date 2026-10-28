import axios from 'axios';

// Base URL of Spring Boot backend
export const API_BASE_URL = 'http://localhost:8080';

// Key used to store auth data in localStorage
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
        const raw = localStorage.getItem(TOKEN_KEY);
        if (raw) {
            try {
                const auth = JSON.parse(raw);
                if (auth.token) {
                    config.headers.Authorization = `Bearer ${auth.token}`;
                }
            } catch {
                // Corrupt localStorage data — ignore
                localStorage.removeItem(TOKEN_KEY);
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
        if (error.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { TOKEN_KEY };