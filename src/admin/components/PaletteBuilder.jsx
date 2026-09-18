import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Palette as PaletteIcon, Sparkles, Shuffle, Plus, Trash2, Save,
  X, Check, Sun, Moon, ChevronDown, ChevronUp, Lock,
} from "lucide-react";
import { usePalette } from "@/context/PaletteContext";
import { useTheme } from "@/context/ThemeContext";
import { COLORS, COLOR_FAMILIES, colorList } from "@/config/colors";
import { getErrorMessage } from "@/utils/errors";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/utils/cn";

export default function PaletteBuilder() {
  const {
    paletteId, palette, presetThemes, customPalettes, loadingCustom,
    setPaletteId, reset, saveCustomPalette, deleteCustomPalette,
    shuffle, previewColors, canEdit,
  } = usePalette();

  const { isDark } = useTheme();
  const [tab, setTab] = useState("presets");
  const [builderOpen, setBuilderOpen] = useState(false);

  const handlePick = (id) => {
    if (!canEdit) {
      toast.error("শুধু অ্যাডমিন থিম পরিবর্তন করতে পারেন");
      return;
    }
    setPaletteId(id);
    toast.success("থিম প্রয়োগ হয়েছে — সব ইউজার দেখবে");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-ink">
            <PaletteIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">রঙের প্যালেট</p>
            <p className="text-[11px] text-muted">
              বর্তমান: <b className="text-ink">{palette.name}</b>
              {palette.custom && (
                <span className="ml-1.5 rounded-full border border-accent-strong/60 bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold">
                  কাস্টম
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-muted">
            {isDark ? "ডার্ক মোড" : "লাইট মোড"}
          </span>

          {!canEdit && (
            <span className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-muted">
              <Lock className="h-3 w-3" />
              শুধু পড়া যাবে
            </span>
          )}

          {canEdit && (
            <button
              onClick={() => setBuilderOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-accent-strong/60 bg-accent/20 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-accent/30"
            >
              <Plus className="h-3.5 w-3.5" />
              নতুন থিম
            </button>
          )}

          <button
            onClick={() => canEdit ? reset() : null}
            disabled={!canEdit}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-1.5 text-xs transition-colors",
              canEdit
                ? "text-muted hover:border-line-strong hover:text-ink"
                : "text-subtle cursor-not-allowed opacity-50"
            )}
          >
            ডিফল্ট
          </button>
        </div>
      </div>

      {canEdit && (
        <div className="rounded-[12px] border border-accent-strong/40 bg-accent/10 p-3 text-[11px] text-ink">
          এই থিম <b>সব ইউজার ও অ্যাডমিন</b> এর ড্যাশবোর্ডে প্রয়োগ হবে।
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-[12px] border border-line bg-surface/50 p-1 backdrop-blur-md">
        <TabBtn active={tab === "presets"} onClick={() => setTab("presets")}>
          প্রিসেট থিম ({presetThemes.length})
        </TabBtn>
        <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>
          কাস্টম থিম ({customPalettes.length})
        </TabBtn>
      </div>

      <AnimatePresence mode="wait">
        {tab === "presets" ? (
          <motion.div
            key="presets"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {presetThemes.map((p, i) => (
              <PaletteCard
                key={p.id}
                palette={p}
                active={p.id === paletteId}
                onPick={() => handlePick(p.id)}
                index={i}
                canEdit={canEdit}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {loadingCustom ? (
              <p className="py-8 text-center text-sm text-muted">লোড হচ্ছে…</p>
            ) : customPalettes.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-line px-6 py-10 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-subtle" />
                <p className="mt-3 text-sm text-ink">এখনো কোনো কাস্টম থিম নেই</p>
                {canEdit && (
                  <>
                    <p className="mt-1 text-xs text-muted">
                      নিজের পছন্দমত ৩টা রঙ বেছে একটা থিম বানান
                    </p>
                    <button
                      onClick={() => setBuilderOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] border border-accent-strong/60 bg-accent/20 px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent/30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      নতুন থিম তৈরি করুন
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {customPalettes.map((p, i) => (
                  <PaletteCard
                    key={p.id}
                    palette={p}
                    active={p.id === paletteId}
                    onPick={() => handlePick(p.id)}
                    onDelete={
                      canEdit ? () => deleteCustomPalette(p.id) : undefined
                    }
                    index={i}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live preview bar */}
      <div className="rounded-[12px] border border-line bg-surface/50 p-4 backdrop-blur-md">
        <p className="label-xs mb-3">প্রিভিউ</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-[11px] text-muted">
            নিউট্রাল
          </span>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            প্রাইমারি
          </span>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ background: "var(--accent-2)", color: "var(--accent-2-fg)" }}
          >
            সেকেন্ডারি
          </span>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ background: "var(--accent-3)", color: "var(--accent-3-fg)" }}
          >
            টারশিয়ারি
          </span>
        </div>
      </div>

      <AnimatePresence>
        {builderOpen && canEdit && (
          <ThemeBuilderModal
            onClose={() => setBuilderOpen(false)}
            onSave={saveCustomPalette}
            shuffle={shuffle}
            previewColors={previewColors}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-[9px] px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "bg-ink text-bg shadow-[var(--shadow-xs)] dark:bg-accent dark:text-accent-fg"
          : "text-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function PaletteCard({ palette, active, onPick, onDelete, index = 0, canEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.015, 0.25) }}
      className={cn(
        "group relative overflow-hidden rounded-[14px] border p-3 text-left transition-all",
        active
          ? "border-accent-strong bg-accent/15 shadow-[var(--shadow-md)]"
          : "border-line bg-surface/50 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2/60",
        !canEdit && "cursor-not-allowed opacity-90"
      )}
    >
      <button
        onClick={onPick}
        disabled={!canEdit}
        className="w-full text-left disabled:cursor-not-allowed"
      >
        <div className="flex gap-1.5">
          {palette.swatch.map((color, idx) => (
            <span
              key={idx}
              className="h-8 flex-1 rounded-[8px] border border-line/60"
              style={{ background: color }}
            />
          ))}
        </div>
        <p className="mt-2.5 text-sm font-semibold text-ink">{palette.name}</p>
        {palette.tagline && (
          <p className="mt-0.5 text-[10px] text-muted">{palette.tagline}</p>
        )}
      </button>

      {active && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-bg shadow-[var(--shadow-sm)] dark:bg-accent-strong dark:text-accent-fg">
          <Check className="h-3 w-3" />
        </span>
      )}

      {onDelete && canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("এই থিমটি মুছবেন?")) onDelete();
          }}
          className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-solid/90 text-muted opacity-0 backdrop-blur-md transition-all hover:text-danger group-hover:opacity-100"
          aria-label="মুছুন"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  THEME BUILDER MODAL                                                */
/* ------------------------------------------------------------------ */

function ThemeBuilderModal({ onClose, onSave, shuffle, previewColors, isDark }) {
  const [name, setName] = useState("");
  const [lightColors, setLightColors] = useState(["red-600", "blue-600", "amber-500"]);
  const [darkColors, setDarkColors] = useState(["red-500", "blue-500", "amber-400"]);
  const [mode, setMode] = useState(isDark ? "dark" : "light");
  const [saving, setSaving] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(null);

  const doShuffle = () => {
    const l = shuffle();
    const d = shuffle();
    setLightColors(l);
    setDarkColors(d);
    previewColors(l, d);
  };

  const handleColorPick = (colorId) => {
    if (!pickerSlot) return;
    const { mode: m, idx } = pickerSlot;
    if (m === "light") {
      const next = [...lightColors];
      next[idx] = colorId;
      setLightColors(next);
      previewColors(next, darkColors);
    } else {
      const next = [...darkColors];
      next[idx] = colorId;
      setDarkColors(next);
      previewColors(lightColors, next);
    }
    setPickerSlot(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("থিমের নাম দিন");
    setSaving(true);
    try {
      await onSave({ name, light: lightColors, dark: darkColors });
      toast.success("থিম সংরক্ষিত — সব ইউজার দেখবে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative max-h-[90dvh] w-full max-w-2xl overflow-hidden rounded-[22px]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-base font-semibold text-ink">নতুন থিম তৈরি</p>
            <p className="text-[11px] text-muted">
              লাইট ও ডার্ক — দুই মোডের ৩টা করে রঙ বেছে নিন
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(90dvh-140px)] space-y-5 overflow-y-auto p-5">
          <Input
            label="থিমের নাম"
            placeholder="যেমন: আমার প্রিয় থিম"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />

          <button
            onClick={doShuffle}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-accent-strong/60 bg-accent/15 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent/25"
          >
            <Shuffle className="h-4 w-4" />
            অটো শাফল
          </button>

          <div className="flex gap-1 rounded-[12px] border border-line bg-surface/50 p-1">
            <button
              onClick={() => setMode("light")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-xs font-medium transition-colors",
                mode === "light"
                  ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                  : "text-muted hover:text-ink"
              )}
            >
              <Sun className="h-3.5 w-3.5" />
              লাইট মোড
            </button>
            <button
              onClick={() => setMode("dark")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-xs font-medium transition-colors",
                mode === "dark"
                  ? "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
                  : "text-muted hover:text-ink"
              )}
            >
              <Moon className="h-3.5 w-3.5" />
              ডার্ক মোড
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((idx) => {
              const ids = mode === "light" ? lightColors : darkColors;
              const cid = ids[idx];
              const hex = COLORS[cid]?.hex || "#cccccc";
              const labels = ["প্রাইমারি", "সেকেন্ডারি", "টারশিয়ারি"];
              return (
                <button
                  key={idx}
                  onClick={() => setPickerSlot({ mode, idx })}
                  className="group flex flex-col items-center gap-2 rounded-[14px] border border-line bg-surface/50 p-3 transition-all hover:border-line-strong hover:bg-surface-2/60"
                >
                  <span
                    className="h-16 w-full rounded-[12px] border border-line/60 shadow-[var(--shadow-sm)] transition-transform group-hover:scale-[1.02]"
                    style={{ background: hex }}
                  />
                  <span className="text-[11px] font-medium text-ink">
                    {labels[idx]}
                  </span>
                  <span className="text-[10px] text-muted">
                    {COLORS[cid]?.name || "—"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-[12px] border border-line bg-surface/50 p-4">
            <p className="label-xs mb-3">দুই মোডের প্রিভিউ</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-2 text-[10px] font-medium text-muted">লাইট</p>
                <div className="flex gap-1">
                  {lightColors.map((cid, i) => (
                    <span
                      key={i}
                      className="h-8 flex-1 rounded-[8px] border border-line/60"
                      style={{ background: COLORS[cid]?.hex }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-medium text-muted">ডার্ক</p>
                <div className="flex gap-1">
                  {darkColors.map((cid, i) => (
                    <span
                      key={i}
                      className="h-8 flex-1 rounded-[8px] border border-line/60"
                      style={{ background: COLORS[cid]?.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            বাতিল
          </Button>
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            সংরক্ষণ করুন
          </Button>
        </div>

        <AnimatePresence>
          {pickerSlot && (
            <ColorPickerSheet
              currentId={
                pickerSlot.mode === "light"
                  ? lightColors[pickerSlot.idx]
                  : darkColors[pickerSlot.idx]
              }
              onPick={handleColorPick}
              onClose={() => setPickerSlot(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ColorPickerSheet({ currentId, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [openFamily, setOpenFamily] = useState(null);

  const all = useMemo(() => colorList(), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [all, query]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((c) => {
      if (!g[c.family]) g[c.family] = [];
      g[c.family].push(c);
    });
    return g;
  }, [filtered]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col bg-bg-elevated/95 backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-sm font-semibold text-ink">রঙ নির্বাচন করুন</p>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] text-muted hover:bg-surface-2 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-line p-3">
        <Input
          placeholder="রঙ খুঁজুন… (নাম বা আইডি)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {COLOR_FAMILIES.map((fam) => {
          const items = grouped[fam.id];
          if (!items || items.length === 0) return null;
          const open = openFamily === null || openFamily === fam.id;
          return (
            <div key={fam.id}>
              <button
                onClick={() =>
                  setOpenFamily(openFamily === fam.id ? "__none__" : fam.id)
                }
                className="mb-2 flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted"
              >
                <span>
                  {fam.name} ({items.length})
                </span>
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {open && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {items.map((c) => {
                    const active = c.id === currentId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => onPick(c.id)}
                        className={cn(
                          "group flex flex-col overflow-hidden rounded-[10px] border text-left transition-all",
                          active
                            ? "border-accent-strong ring-2 ring-accent-strong/40"
                            : "border-line hover:-translate-y-0.5 hover:border-line-strong"
                        )}
                      >
                        <span
                          className="h-12 w-full"
                          style={{ background: c.hex }}
                        />
                        <span className="truncate bg-surface-solid px-2 py-1.5 text-[10px] text-ink">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            কোনো রঙ পাওয়া যায়নি
          </p>
        )}
      </div>
    </motion.div>
  );
}