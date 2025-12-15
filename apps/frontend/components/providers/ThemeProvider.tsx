"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    // Get initial theme from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored && ["light", "dark", "system"].includes(stored)) {
            setThemeState(stored);
        }
        setMounted(true);
    }, []);

    // Apply theme to document and update resolved theme
    useEffect(() => {
        const root = document.documentElement;
        const resolved = theme === "system" ? getSystemTheme() : theme;

        root.classList.remove("light", "dark");
        root.classList.add(resolved);
        setResolvedTheme(resolved);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            setResolvedTheme(getSystemTheme());
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(getSystemTheme());
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(resolvedTheme === "light" ? "dark" : "light");
    }, [resolvedTheme, setTheme]);

    // Prevent flash of incorrect theme
    if (!mounted) {
        return (
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        (function() {
                            const stored = localStorage.getItem('${STORAGE_KEY}');
                            const theme = stored || '${defaultTheme}';
                            const resolved = theme === 'system' 
                                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                                : theme;
                            document.documentElement.classList.add(resolved);
                        })();
                    `,
                }}
            />
        );
    }

    return (
        <ThemeContext.Provider
            value={{ theme, resolvedTheme, setTheme, toggleTheme }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
