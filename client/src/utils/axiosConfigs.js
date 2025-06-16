import axios from 'axios';

// Import store after it's created to avoid circular dependency
let store;

const getStore = () => {
    if (!store) {
        // Dynamic import to avoid circular dependency
        store = require('../app/store').store;
    }
    return store;
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 seconds timeout
    withCredentials: true, // Include cookies in requests (for refresh token)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const currentStore = getStore();
        const state = currentStore.getState();
        const token = state.auth.accessToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
                const currentStore = getStore();

                // Update Redux store with new token
                currentStore.dispatch(setCredentials({ accessToken, user }));

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Dynamic import to avoid circular dependency
                const { clearCredentials } = await import('../app/authSlice');
                const currentStore = getStore();

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
