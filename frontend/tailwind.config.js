/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // HireSense Light Theme Palette
                'bg-gray': '#F8F9FB',      // Main Background
                'surface': '#FFFFFF',      // Card Background
                'primary': '#3B82F6',      // Blue 500 (Brand)
                'primary-dark': '#2563EB', // Blue 600
                'secondary': '#6366F1',    // Indigo 500
                'accent': '#F59E0B',       // Amber 500
                'success': '#10B981',      // Emerald 500
                'danger': '#EF4444',       // Red 500
                'text-main': '#111827',    // Gray 900
                'text-muted': '#6B7280',   // Gray 500
                'border-light': '#E5E7EB', // Gray 200
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
            },
        },
    },
    plugins: [],
}
