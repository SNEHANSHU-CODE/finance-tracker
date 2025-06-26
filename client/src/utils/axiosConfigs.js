import axios from 'axios';

// Cache for store to avoid multiple dynamic imports
let storeCache = null;

const getStore = async () => {
    if (!storeCache) {
        // Dynamic import to avoid circular dependency
        const module = await import('../app/store');
        storeCache = module.store;
    }
    return storeCache;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 seconds timeout
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    async (config) => {
        const useCookieAuth = config.url?.includes('/transaction') || config.headers['X-Cookie-Auth'];
        
        if (useCookieAuth) {
            return config;
        }
        
        try {
            const currentStore = await getStore();
            const state = currentStore.getState();
            const token = state.auth.accessToken;

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Could not get store in request interceptor:', error);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token using httpOnly cookie
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken, user } = refreshResponse.data;

                // Dynamic import to avoid circular dependency
                const { setCredentials } = await import('../app/authSlice');
                const currentStore = await getStore();

                // Update Redux store with new token
                currentStore.dispatch(setCredentials({ accessToken, user }));

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Dynamic import to avoid circular dependency
                const { clearCredentials } = await import('../app/authSlice');
                const currentStore = await getStore();

                // Refresh failed, clear auth state
                currentStore.dispatch(clearCredentials());

                // Optionally redirect to login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
