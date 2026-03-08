import axios from 'axios';

// Cache for store to avoid multiple dynamic imports — same pattern as axiosConfigs.js
let storeCache = null;

const getStore = async () => {
    if (!storeCache) {
        const module = await import('../app/store');
        storeCache = module.store;
    }
    return storeCache;
};

const CHAT_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:5002';

// Separate axios instance pointing at the Python chatServer
const chatServerClient = axios.create({
    baseURL: CHAT_SERVER_URL,
    timeout: 30000,         // longer timeout — PDF extraction can take a few seconds
    withCredentials: false, // chatServer doesn't use httpOnly cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach the same JWT the mainServer uses.
// chatServer can use it to identify the user if needed.
chatServerClient.interceptors.request.use(
    async (config) => {
        try {
            const currentStore = await getStore();
            const state = currentStore.getState();
            const token = state.auth.accessToken;

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('chatServerClient: could not attach auth token:', error);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — no token refresh here.
// chatServer doesn't issue tokens so a 401 means the main token is just expired.
// Let the user's next mainServer call trigger the refresh via axiosConfigs.js.
chatServerClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status  = error.response?.status;
        const url     = error.config?.url || '';

        if (status === 401) {
            // Token expired — log clearly, let main apiClient handle refresh on next call
            console.warn(`chatServerClient: 401 on ${url} — token may be expired`);
        } else if (status === 422) {
            // FastAPI validation error — surface the detail message cleanly
            const detail = error.response?.data?.detail;
            const message = Array.isArray(detail)
                ? detail.map(d => d.msg).join(', ')
                : detail || 'Validation error';
            return Promise.reject(new Error(message));
        } else if (!error.response) {
            // Network error — chatServer may be down
            return Promise.reject(
                new Error('Cannot reach the import server. Please check your connection.')
            );
        }

        return Promise.reject(error);
    }
);

export default chatServerClient;