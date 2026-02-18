import { useState, createContext, useContext, useMemo, type ReactNode } from "react";

type ThemeColor = "navy" | "royal" | "sky";

interface ThemeConfig {
    id: ThemeColor;
    name: string;
    gradient: string;
    shadowColor: string;
    glowColor: string;
    bgEffect: string;
}

export const THEME_CONFIGS: Record<ThemeColor, ThemeConfig> = {
    navy: {
        id: "navy",
        name: "Deep Navy",
        gradient: "from-blue-800 via-blue-700 to-blue-600",
        shadowColor: "shadow-blue-900/30",
        glowColor: "bg-blue-400/15",
        bgEffect: "bg-blue-600/10"
    },
    royal: {
        id: "royal",
        name: "Royal Blue",
        gradient: "from-blue-600 via-blue-500 to-blue-600",
        shadowColor: "shadow-blue-600/30",
        glowColor: "bg-blue-400/15",
        bgEffect: "bg-blue-500/10"
    },
    sky: {
        id: "sky",
        name: "Sky Blue",
        gradient: "from-sky-600 via-sky-500 to-cyan-500",
        shadowColor: "shadow-sky-500/30",
        glowColor: "bg-cyan-400/15",
        bgEffect: "bg-sky-400/10"
    }
};

interface ThemeContextType {
    theme: ThemeColor;
    setTheme: (theme: ThemeColor) => void;
    themeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "monev-hero-theme";

export function HeroThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeColor>(() => {
        if (typeof window === "undefined") return "navy";
        const saved = localStorage.getItem(STORAGE_KEY) as ThemeColor | null;
        return saved && THEME_CONFIGS[saved] ? saved : "navy";
    });

    const setTheme = (newTheme: ThemeColor) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    };

    const themeConfig = useMemo(() => THEME_CONFIGS[theme], [theme]);

    const value: ThemeContextType = useMemo(() => ({
        theme,
        setTheme,
        themeConfig
    }), [theme, themeConfig]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useHeroTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useHeroTheme must be used within HeroThemeProvider");
    }
    return context;
}

export type { ThemeColor, ThemeConfig };
