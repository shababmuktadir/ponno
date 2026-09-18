import {
  createContext, useContext, useEffect, useState, useCallback, useMemo,
} from "react";

const FontSizeContext = createContext(null);
const KEY = "pm.fontSize";

export const FONT_SIZES = [
  { id: "sm", label: "ছোট",         px: 14,   sample: "ক" },
  { id: "md", label: "স্বাভাবিক",    px: 16,   sample: "ক" },
  { id: "lg", label: "বড়",          px: 17.5, sample: "ক" },
  { id: "xl", label: "অতিরিক্ত বড়",  px: 19,   sample: "ক" },
];

// ---- Fallback (used only when provider is missing) ----
const FALLBACK = {
  sizeId: "md",
  current: FONT_SIZES[1],
  sizes: FONT_SIZES,
  setSize: () => {},
  increase: () => {},
  decrease: () => {},
  reset: () => {},
  canIncrease: false,
  canDecrease: false,
};

export function FontSizeProvider({ children }) {
  const [sizeId, setSizeId] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return FONT_SIZES.some((s) => s.id === saved) ? saved : "md";
    } catch {
      return "md";
    }
  });

  const current = useMemo(
    () => FONT_SIZES.find((s) => s.id === sizeId) || FONT_SIZES[1],
    [sizeId]
  );

  useEffect(() => {
    try {
      localStorage.setItem(KEY, sizeId);
    } catch {
      /* storage blocked — ignore */
    }
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${current.px}px`
    );
    document.documentElement.setAttribute("data-font-size", sizeId);
  }, [sizeId, current]);

  const setSize = useCallback((id) => {
    if (FONT_SIZES.some((s) => s.id === id)) setSizeId(id);
  }, []);

  const increase = useCallback(() => {
    const i = FONT_SIZES.findIndex((s) => s.id === sizeId);
    if (i < FONT_SIZES.length - 1) setSizeId(FONT_SIZES[i + 1].id);
  }, [sizeId]);

  const decrease = useCallback(() => {
    const i = FONT_SIZES.findIndex((s) => s.id === sizeId);
    if (i > 0) setSizeId(FONT_SIZES[i - 1].id);
  }, [sizeId]);

  const reset = useCallback(() => setSizeId("md"), []);

  const value = useMemo(
    () => ({
      sizeId,
      current,
      sizes: FONT_SIZES,
      setSize,
      increase,
      decrease,
      reset,
      canIncrease: sizeId !== FONT_SIZES[FONT_SIZES.length - 1].id,
      canDecrease: sizeId !== FONT_SIZES[0].id,
    }),
    [sizeId, current, setSize, increase, decrease, reset]
  );

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);

  // ⚠️ যদি provider না থাকে → crash না করে fallback দাও + DEV এ warn
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn(
        "[useFontSize] FontSizeProvider পাওয়া যায়নি। " +
          "src/App.jsx এ <FontSizeProvider> দিয়ে <AppRoutes /> wrap করা আছে কি না দেখুন।"
      );
    }
    return FALLBACK;
  }

  return ctx;
}