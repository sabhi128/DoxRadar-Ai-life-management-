import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: '/api', // Proxy is set in vite.config.js usually, or strictly '/api'
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Supabase Token
api.interceptors.request.use(
    async (config) => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor (optional, for global error handling)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized (maybe redirect to login or refresh token if Supabase doesn't auto-handle)
            // Supabase client handles refresh automatically usually, so session.access_token should be fresh.
        }
        return Promise.reject(error);
    }
);

export default api;
