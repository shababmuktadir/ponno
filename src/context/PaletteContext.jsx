import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import {
  doc, getDoc, onSnapshot, serverTimestamp, setDoc, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  DEFAULT_PALETTE_ID, PRESET_THEMES, buildCustomPalette, randomColorIds,
} from "@/config/themes";

const PaletteContext = createContext(null);
const KEY = "pm.paletteId";

const APPEARANCE_DOC = () => doc(db, "systemSettings", "appearance");

function toVar(key) {
  return (
    "--" + key.replace(/([A-Z])/g, "-$1").replace(/(\d)/g, "-$1").toLowerCase()
  );
}

function applyColors(colors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([k, v]) => {
    root.style.setProperty(toVar(k), v);
  });
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-strong", colors.accentStrong);
  root.style.setProperty("--accent-fg", colors.accentFg);
}

export function PaletteProvider({ children }) {
  const { theme } = useTheme();
  const { firebaseUser, isAdmin, isSuperAdmin } = useAuth() || {};

  const [paletteId, setPaletteIdState] = useState(() => {
    try {
      return localStorage.getItem(KEY) || DEFAULT_PALETTE_ID;
    } catch {
      return DEFAULT_PALETTE_ID;
    }
  });

  const [customDocs, setCustomDocs] = useState([]);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const unsubRef = useRef(null);

  // -------- Realtime: global appearance doc --------
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    // No auth → just use local fallback
    if (!firebaseUser) {
      setLoadingCustom(false);
      return;
    }

    setLoadingCustom(true);
    const ref = APPEARANCE_DOC();

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.activePaletteId) {
            setPaletteIdState(data.activePaletteId);
            try {
              localStorage.setItem(KEY, data.activePaletteId);
            } catch {
              /* ignore */
            }
          }
          if (Array.isArray(data.customPalettes)) {
            setCustomDocs(data.customPalettes);
          }
        }
        setLoadingCustom(false);
      },
      (err) => {
        if (import.meta.env.DEV) console.error("[appearance]", err);
        setLoadingCustom(false);
      }
    );

    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [firebaseUser]);

  // -------- Merge preset + global custom palettes --------
  const customPalettes = useMemo(
    () => customDocs.map((d) => buildCustomPalette(d.id, d)),
    [customDocs]
  );

  const palettes = useMemo(
    () => [...PRESET_THEMES, ...customPalettes],
    [customPalettes]
  );

  // -------- Active palette --------
  const palette = useMemo(
    () => palettes.find((p) => p.id === paletteId) || PRESET_THEMES[0],
    [palettes, paletteId]
  );

  // -------- Apply CSS vars --------
  useEffect(() => {
    const colors = theme === "dark" ? palette.dark : palette.light;
    applyColors(colors);
    document.documentElement.setAttribute("data-palette", paletteId);
    document.documentElement.setAttribute("data-theme", theme);
  }, [palette, paletteId, theme]);

  // -------- Admin actions (write to Firestore) --------
  const canEdit = Boolean(isAdmin || isSuperAdmin);

  const setPaletteId = useCallback(
    async (id) => {
      // instant local apply (optimistic)
      setPaletteIdState(id);
      try {
        localStorage.setItem(KEY, id);
      } catch {
        /* ignore */
      }

      if (!canEdit) return; // non-admin only sees locally

      try {
        await setDoc(
          APPEARANCE_DOC(),
          { activePaletteId: id, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        if (import.meta.env.DEV) console.error("[setPaletteId]", err);
      }
    },
    [canEdit]
  );

  const reset = useCallback(
    () => setPaletteId(DEFAULT_PALETTE_ID),
    [setPaletteId]
  );

  const saveCustomPalette = useCallback(
    async ({ name, light, dark }) => {
      if (!canEdit) throw new Error("শুধু অ্যাডমিন থিম তৈরি করতে পারেন");
      if (!name?.trim()) throw new Error("নাম দিন");
      if (!light?.length || light.length < 3)
        throw new Error("লাইট মোডে ৩টা রঙ নির্বাচন করুন");
      if (!dark?.length || dark.length < 3)
        throw new Error("ডার্ক মোডে ৩টা রঙ নির্বাচন করুন");

      const newId =
        "c_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

      const entry = {
        id: newId,
        name: name.trim(),
        light,
        dark,
        createdAt: Date.now(),
        createdBy: firebaseUser?.uid || null,
      };

      await setDoc(
        APPEARANCE_DOC(),
        {
          customPalettes: arrayUnion(entry),
          activePaletteId: newId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setPaletteIdState(newId);
      try {
        localStorage.setItem(KEY, newId);
      } catch {
        /* ignore */
      }

      return newId;
    },
    [canEdit, firebaseUser]
  );

  const deleteCustomPalette = useCallback(
    async (id) => {
      if (!canEdit) throw new Error("শুধু অ্যাডমিন মুছতে পারেন");

      const target = customDocs.find((d) => d.id === id);
      if (!target) return;

      await setDoc(
        APPEARANCE_DOC(),
        {
          customPalettes: arrayRemove(target),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (paletteId === id) {
        setPaletteIdState(DEFAULT_PALETTE_ID);
        try {
          localStorage.setItem(KEY, DEFAULT_PALETTE_ID);
        } catch {
          /* ignore */
        }
        await setDoc(
          APPEARANCE_DOC(),
          { activePaletteId: DEFAULT_PALETTE_ID, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    },
    [canEdit, customDocs, paletteId]
  );

  const shuffle = useCallback(() => randomColorIds(), []);

  const previewColors = useCallback(
    (lightIds, darkIds) => {
      const built = buildCustomPalette("__preview__", {
        name: "__preview__",
        light: lightIds,
        dark: darkIds,
      });
      applyColors(theme === "dark" ? built.dark : built.light);
    },
    [theme]
  );

  const value = useMemo(
    () => ({
      paletteId,
      palette,
      palettes,
      presetThemes: PRESET_THEMES,
      customPalettes,
      loadingCustom,
      isCustom: !!palette.custom,
      canEdit,
      setPaletteId,
      reset,
      saveCustomPalette,
      deleteCustomPalette,
      shuffle,
      previewColors,
    }),
    [
      paletteId, palette, palettes, customPalettes, loadingCustom,
      canEdit, setPaletteId, reset, saveCustomPalette,
      deleteCustomPalette, shuffle, previewColors,
    ]
  );

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    return {
      paletteId: DEFAULT_PALETTE_ID,
      palette: PRESET_THEMES[0],
      palettes: PRESET_THEMES,
      presetThemes: PRESET_THEMES,
      customPalettes: [],
      loadingCustom: false,
      isCustom: false,
      canEdit: false,
      setPaletteId: () => {},
      reset: () => {},
      saveCustomPalette: async () => {},
      deleteCustomPalette: async () => {},
      shuffle: () => randomColorIds(),
      previewColors: () => {},
    };
  }
  return ctx;
}

export function usePaletteColors() {
  const { theme } = useTheme();
  const { paletteId } = usePalette();

  const [colors, setColors] = useState({
    accent: "#E11D48",
    accent2: "#2563EB",
    accent3: "#F59E0B",
    grid: "rgba(10,10,10,0.08)",
    axis: "#56565C",
  });

  useEffect(() => {
    const id = setTimeout(() => {
      const s = getComputedStyle(document.documentElement);
      setColors({
        accent: s.getPropertyValue("--accent-strong").trim() || "#E11D48",
        accent2: s.getPropertyValue("--accent-2-strong").trim() || "#2563EB",
        accent3: s.getPropertyValue("--accent-3-strong").trim() || "#F59E0B",
        grid: s.getPropertyValue("--border").trim() || "rgba(10,10,10,0.08)",
        axis: s.getPropertyValue("--text-muted").trim() || "#56565C",
      });
    }, 30);
    return () => clearTimeout(id);
  }, [theme, paletteId]);

  return colors;
}