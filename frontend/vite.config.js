import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        // Split heavy libraries into separate chunks for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-ui': ['framer-motion', 'lucide-react'],
                    'vendor-charts': ['recharts'],
                    'vendor-supabase': ['@supabase/supabase-js'],
                },
            },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 600,
        // Enable minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,  // Remove console.logs in production
                drop_debugger: true,
            },
        },
    },
})
