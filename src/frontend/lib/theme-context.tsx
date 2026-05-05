import { useState, useEffect, useCallback, type ReactNode } from "react";
import { createContext, useContext } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "monev-theme";

function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "light";
    
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
        return stored;
    }
    
    // Default to light so a fresh APK/WebView matches the PWA's default look.
    // Users can still switch to dark mode and it will be stored above.
    return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const initial = getInitialTheme();
        setThemeState(initial);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        const root = document.documentElement;
        
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme, mounted]);

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === "light" ? "dark" : "light");
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    const value: ThemeContextType = {
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === "dark"
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
