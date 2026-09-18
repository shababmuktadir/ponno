import {
  createContext, useContext, useEffect, useState, useCallback, useMemo,
} from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "pm.theme";
const FONT_KEY = "pm.fontSize";

// Font scale — root font-size (px) এ apply হবে
export const FONT_SCALES = [
  { id: "xs",  label: "অতি ছোট",  px: 13, percent: 87  },
  { id: "sm",  label: "ছোট",      px: 14, percent: 93  },
  { id: "md",  label: "স্বাভাবিক", px: 15, percent: 100 },
  { id: "lg",  label: "বড়",      px: 16, percent: 107 },
  { id: "xl",  label: "অতি বড়",  px: 18, percent: 120 },
];

const DEFAULT_FONT_ID = "md";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [fontId, setFontId] = useState(() => {
    const saved = localStorage.getItem(FONT_KEY);
    return FONT_SCALES.some((s) => s.id === saved) ? saved : DEFAULT_FONT_ID;
  });

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0B0B0C" : "#F7F6F3");
  }, [theme]);

  // Apply font size — CSS variable driven
  useEffect(() => {
    const scale = FONT_SCALES.find((s) => s.id === fontId) || FONT_SCALES[2];
    const root = document.documentElement;
    root.style.setProperty("--app-font-size", `${scale.px}px`);
    root.style.setProperty("--app-font-scale", String(scale.px / 15));
    localStorage.setItem(FONT_KEY, fontId);
  }, [fontId]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggle,
      isDark: theme === "dark",

      fontId,
      setFontId,
      fontScales: FONT_SCALES,
      currentFont: FONT_SCALES.find((s) => s.id === fontId) || FONT_SCALES[2],
      increaseFont: () => {
        const idx = FONT_SCALES.findIndex((s) => s.id === fontId);
        if (idx < FONT_SCALES.length - 1) setFontId(FONT_SCALES[idx + 1].id);
      },
      decreaseFont: () => {
        const idx = FONT_SCALES.findIndex((s) => s.id === fontId);
        if (idx > 0) setFontId(FONT_SCALES[idx - 1].id);
      },
      resetFont: () => setFontId(DEFAULT_FONT_ID),
    }),
    [theme, toggle, fontId]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}