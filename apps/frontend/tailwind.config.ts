import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Primary - Teal (Education, Trust)
                primary: {
                    50: '#F0FDFA',
                    100: '#CCFBF1',
                    200: '#99F6E4',
                    300: '#5EEAD4',
                    400: '#2DD4BF',
                    500: '#0D9488',
                    600: '#0F766E',
                    700: '#115E59',
                    800: '#134E4A',
                    900: '#0F3F3C',
                },
                // Accent - Orange (CTA, Excitement)
                accent: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#EA580C',
                    600: '#DC2626',
                    700: '#B91C1C',
                    800: '#991B1B',
                    900: '#7F1D1D',
                },
                // CSS Variable based colors
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'xl': '0.875rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'fade-out': 'fadeOut 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-out-right': 'slideOutRight 0.3s ease-out',
                'slide-in-up': 'slideInUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideOutRight: {
                    '0%': { transform: 'translateX(0)', opacity: '1' },
                    '100%': { transform: 'translateX(100%)', opacity: '0' },
                },
                slideInUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            transitionDuration: {
                '250': '250ms',
            },
        },
    },
    plugins: [],
};

export default config;
