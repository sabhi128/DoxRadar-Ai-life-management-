import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — always get a FRESH token before each API call
api.interceptors.request.use(
    async (config) => {
        const interceptorStart = Date.now();
        // First try getSession (fast, cached)
        let { data: { session } } = await supabase.auth.getSession();

        // If the token is expired or about to expire (within 60s), force a refresh
        if (session?.expires_at) {
            const expiresAt = session.expires_at * 1000; // convert to ms
            const now = Date.now();
            const bufferMs = 60 * 1000; // 60 second buffer before expiry

            if (now >= expiresAt - bufferMs) {
                console.log('[api] Token expiring soon, refreshing...');
                const { data: refreshData, error } = await supabase.auth.refreshSession();
                if (!error && refreshData?.session) {
                    session = refreshData.session;
                } else {
                    console.warn('[api] Token refresh failed:', error?.message);
                }
            }
        }

        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Track retry state to avoid infinite loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor — auto-retry on 401 with refreshed token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried this request yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Another request is already refreshing — queue this one
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data, error: refreshError } = await supabase.auth.refreshSession();

                if (refreshError || !data?.session) {
                    processQueue(refreshError || new Error('Session expired'));
                    // Session truly expired — redirect to login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const newToken = data.session.access_token;
                processQueue(null, newToken);

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr);
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
