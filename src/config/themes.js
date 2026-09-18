import { COLORS, getColor } from "./colors";

/* ============================================================
   COLOR MATH HELPERS
   ============================================================ */

function hexToRgb(hex) {
  const h = String(hex).replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

export function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const nl = Math.min(96, l + amount);
  const { r: nr, g: ng, b: nb } = hslToRgb(h, s, nl);
  return rgbToHex(nr, ng, nb);
}

export function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const nl = Math.max(6, l - amount);
  const { r: nr, g: ng, b: nb } = hslToRgb(h, s, nl);
  return rgbToHex(nr, ng, nb);
}

export function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getContrastText(hex) {
  const { r, g, b } = hexToRgb(hex);
  // WCAG relative luminance
  const lum =
    0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  return lum > 0.55 ? "#0B0B0C" : "#FFFFFF";
}

/* ============================================================
   BUILD PALETTE FROM 3 COLOR IDS
   ============================================================ */

export function buildPalette(id, name, lightIds, darkIds, meta = {}) {
  const lc = (lightIds || []).map((c) => getColor(c));
  const dc = (darkIds || lightIds || []).map((c) => getColor(c));

  // Fill missing with defaults
  while (lc.length < 3) lc.push("#C9B994");
  while (dc.length < 3) dc.push("#E6DDC9");

  const [l1, l2, l3] = lc;
  const [d1, d2, d3] = dc;

  return {
    id,
    name: name || "কাস্টম",
    tagline: meta.tagline || "কাস্টম থিম",
    description: meta.description || "",
    swatch: [l1, l2, l3],
    custom: !!meta.custom,

    light: {
      accent:        l1,
      accentStrong:  darken(l1, 12),
      accentFg:      getContrastText(l1),
      accent2:       l2,
      accent2Strong: darken(l2, 12),
      accent2Fg:     getContrastText(l2),
      accent3:       l3,
      accent3Strong: darken(l3, 12),
      accent3Fg:     getContrastText(l3),
      orb1: hexToRgba(l1, 0.22),
      orb2: hexToRgba(l2, 0.18),
      orb3: hexToRgba(l3, 0.16),
      orb4: "rgba(255,255,255,0.9)",
    },

    dark: {
      accent:        lighten(d1, 12),
      accentStrong:  lighten(d1, 22),
      accentFg:      getContrastText(lighten(d1, 12)),
      accent2:       lighten(d2, 12),
      accent2Strong: lighten(d2, 22),
      accent2Fg:     getContrastText(lighten(d2, 12)),
      accent3:       lighten(d3, 12),
      accent3Strong: lighten(d3, 22),
      accent3Fg:     getContrastText(lighten(d3, 12)),
      orb1: hexToRgba(d1, 0.14),
      orb2: hexToRgba(d2, 0.12),
      orb3: hexToRgba(d3, 0.10),
      orb4: "rgba(40,40,50,0.6)",
    },
  };
}

/* ============================================================
   50 PRESET THEMES
   ============================================================ */

const P = (id, name, tagline, light, dark) =>
  buildPalette(id, name, light, dark || light, { tagline });

export const PRESET_THEMES = [
  // ─── WARM TRIADIC (10) ───
  P("vivid",       "ভিভিড",           "লাল • নীল • হলুদ",       ["red-600", "blue-600", "amber-500"]),
  P("ember",       "এম্বার",           "লাল • কমলা • সোনালি",     ["red-600", "orange-600", "amber-500"]),
  P("sunset",      "সূর্যাস্ত",         "কমলা • গোলাপি • হলুদ",    ["orange-500", "pink-500", "yellow-500"]),
  P("fire",        "অগ্নি",           "লাল • কমলা • সোনালি",     ["red-500", "orange-500", "gold"]),
  P("spice",       "মশলা",            "লাল • কমলা • মরিচা",      ["red-600", "orange-600", "bronze"]),
  P("peach",       "পিচ",             "পিচ • কোরাল • কমলা",     ["peach", "coral", "orange-500"]),
  P("autumn",      "শরৎ",            "লাল • কমলা • অলিভ",       ["red-600", "orange-500", "olive"]),
  P("saffron",     "জাফরান",          "জাফরান • সোনালি • কমলা",   ["honey", "gold", "orange-500"]),
  P("rose-gold",   "রোজ গোল্ড",       "রোজ • সোনালি • কপার",     ["rose-500", "gold", "copper"]),
  P("warm-mono",   "উষ্ণ মনো",        "লাল • গোলাপি • কমলা",     ["red-500", "pink-500", "orange-500"]),

  // ─── COOL TRIADIC (10) ───
  P("ocean",       "ওশিয়ান",          "নীল • সায়ান • টিল",        ["blue-600", "cyan-500", "teal-500"]),
  P("sky",         "আকাশ",            "আকাশি • নীল • সায়ান",     ["sky-500", "blue-500", "cyan-500"]),
  P("ice",         "বরফ",             "সায়ান • নীল • আকাশি",     ["cyan-500", "blue-500", "sky-400"]),
  P("indigo-dream","ইন্ডিগো স্বপ্ন",    "ইন্ডিগো • ভায়োলেট • নীল",  ["indigo-600", "violet-500", "blue-600"]),
  P("teal-calm",   "টিল শান্ত",        "টিল • মিন্ট • আকাশি",      ["teal-500", "mint", "sky-400"]),
  P("navy",        "নেভি",            "নেভি • নীল • আকাশি",       ["navy", "blue-500", "sky-400"]),
  P("arctic",      "আর্কটিক",          "বরফ • টিল • আকাশি",        ["cyan-400", "teal-500", "sky-400"]),
  P("deep-sea",    "গভীর সমুদ্র",      "নেভি • টিল • সায়ান",       ["navy", "teal-600", "cyan-500"]),
  P("royal",       "রয়্যাল",          "রয়্যাল • ইন্ডিগো • ভায়োলেট", ["royal", "indigo-500", "violet-500"]),
  P("cobalt-wave", "কোবাল্ট ঢেউ",      "কোবাল্ট • সায়ান • আকাশি",  ["cobalt", "cyan-500", "sky-500"]),

  // ─── NATURE (10) ───
  P("forest",      "ফরেস্ট",           "ফরেস্ট • সবুজ • অলিভ",    ["forest", "green-600", "olive"]),
  P("emerald",     "এমারেল্ড বাগান",    "এমারেল্ড • সবুজ • লাইম",  ["emerald-500", "green-600", "lime-500"]),
  P("mint-fresh",  "মিন্ট",            "মিন্ট • এমারেল্ড • টিল",  ["mint", "emerald-500", "teal-500"]),
  P("leaf",        "পাতা",             "সবুজ • অলিভ • লাইম",     ["green-600", "olive", "lime-500"]),
  P("moss",        "মস",              "মস • অলিভ • ফরেস্ট",     ["moss", "olive", "forest"]),
  P("bamboo",      "বাঁশ",            "সেজ • সবুজ • অলিভ",       ["sage", "green-500", "olive"]),
  P("sage-garden", "সেজ বাগান",       "সেজ • মস • এমারেল্ড",     ["sage", "moss", "emerald-500"]),
  P("jungle",      "জঙ্গল",            "ফরেস্ট • অলিভ • সবুজ",   ["forest", "olive", "green-600"]),
  P("spring",      "বসন্ত",            "সবুজ • হলুদ • গোলাপি",    ["green-500", "yellow-500", "pink-500"]),
  P("meadow",      "তৃণভূমি",          "সেজ • মিন্ট • সবুজ",      ["sage", "mint", "green-500"]),

  // ─── PURPLE / MYSTIC (10) ───
  P("mystic",      "মিস্টিক",          "বেগুনি • ভায়োলেট • গোলাপি", ["purple-500", "violet-500", "pink-500"]),
  P("lavender",    "ল্যাভেন্ডার",       "ল্যাভেন্ডার • বেগুনি • গোলাপি", ["lavender", "purple-500", "pink-400"]),
  P("plum",        "প্লাম",           "প্লাম • মাউভ • বেগুনি",   ["plum", "mauve", "purple-500"]),
  P("orchid",      "অর্কিড",           "অর্কিড • ম্যাজেন্টা • বেগুনি", ["orchid", "magenta", "purple-500"]),
  P("amethyst",    "অ্যামিথিস্ট",       "ভায়োলেট • বেগুনি • ল্যাভেন্ডার", ["violet-500", "purple-500", "lavender"]),
  P("royal-purple","রাজকীয় বেগুনি",  "ইন্ডিগো • ভায়োলেট • বেগুনি", ["indigo-600", "violet-500", "purple-500"]),
  P("pink-dream",  "গোলাপি স্বপ্ন",     "গোলাপি • ম্যাজেন্টা • রোজ", ["pink-500", "magenta", "rose-500"]),
  P("fuchsia-pop", "ফুশিয়া পপ",       "ফুশিয়া • ম্যাজেন্টা • গোলাপি", ["fuchsia-500", "magenta", "pink-500"]),
  P("berry",       "বেরি",            "প্লাম • ম্যাজেন্টা • ফুশিয়া", ["plum", "magenta", "fuchsia-500"]),
  P("violet-blush","ভায়োলেট ব্লাশ",    "ভায়োলেট • মাউভ • গোলাপি", ["violet-500", "mauve", "pink-400"]),

  // ─── NEUTRAL / MONO (10) ───
  P("classic",     "ক্লাসিক",          "বেইজ • টাউপ • নিউট্রাল",   ["beige", "taupe", "stone-500"]),
  P("mono-gray",   "মনো গ্রে",         "ধূসর • স্লেট • চারকোল",    ["gray-500", "slate-500", "charcoal"]),
  P("slate-cool",  "স্লেট কুল",        "স্লেট • ধূসর • জিংক",      ["slate-500", "gray-500", "zinc-600"]),
  P("warm-neutral","উষ্ণ নিউট্রাল",    "স্টোন • টাউপ • বেইজ",      ["stone-500", "taupe", "beige"]),
  P("noir",        "নোয়ার",           "কালো • ধূসর • চারকোল",     ["black", "gray-700", "charcoal"]),
  P("cloud",       "মেঘ",             "অফ-হোয়াইট • সিলভার • প্ল্যাটিনাম", ["off-white", "silver", "platinum"]),
  P("steel",       "স্টিল",           "স্টিল • ধূসর • স্লেট",     ["steel-blue", "gray-500", "slate-600"]),
  P("graphite",    "গ্রাফাইট",         "চারকোল • ধূসর • গানমেটাল",  ["charcoal", "gray-700", "gunmetal"]),
  P("pearl",       "মুক্তা",           "প্ল্যাটিনাম • সিলভার • অফ-হোয়াইট", ["platinum", "silver", "off-white"]),
  P("coffee",      "কফি",             "টাউপ • কপার • ব্রোঞ্জ",   ["taupe", "copper", "bronze"]),
];

export const DEFAULT_PALETTE_ID = "vivid";

export function getPresetPalette(id) {
  return PRESET_THEMES.find((p) => p.id === id) || PRESET_THEMES[0];
}

/**
 * For custom palettes loaded from Firestore, this rebuilds from color IDs.
 * Doc shape: { name, light: [id1, id2, id3], dark: [id1, id2, id3] }
 */
export function buildCustomPalette(docId, doc) {
  return buildPalette(
    docId,
    doc.name || "কাস্টম",
    doc.light || [],
    doc.dark || doc.light || [],
    { custom: true, tagline: "আমার থিম" }
  );
}

export function randomColorIds() {
  const keys = Object.keys(COLORS);
  const pick = () => keys[Math.floor(Math.random() * keys.length)];
  const c1 = pick();
  let c2 = pick();
  let c3 = pick();
  // avoid duplicates
  let guard = 0;
  while (c2 === c1 && guard++ < 5) c2 = pick();
  guard = 0;
  while ((c3 === c1 || c3 === c2) && guard++ < 5) c3 = pick();
  return [c1, c2, c3];
}