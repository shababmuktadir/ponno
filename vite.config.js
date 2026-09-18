import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "./package.json"), "utf-8")
);

/**
 * Vite 8 (Rolldown) requires manualChunks as a FUNCTION.
 */
function manualChunks(id) {
  if (!id.includes("node_modules")) return;

  if (
    id.includes("/react/") ||
    id.includes("/react-dom/") ||
    id.includes("/react-router/") ||
    id.includes("/react-router-dom/") ||
    id.includes("/scheduler/")
  ) {
    return "react";
  }

  if (id.includes("/firebase/") || id.includes("/@firebase/")) {
    return "firebase";
  }

  if (
    id.includes("/@mui/") ||
    id.includes("/@emotion/") ||
    id.includes("/@material-ui/")
  ) {
    return "mui";
  }

  if (id.includes("/recharts/") || id.includes("/d3-")) {
    return "charts";
  }

  if (id.includes("/xlsx/")) {
    return "xlsx";
  }

  if (id.includes("/jspdf/") || id.includes("/html2canvas/")) {
    return "pdf";
  }

  if (id.includes("/framer-motion/") || id.includes("/motion-dom/")) {
    return "motion";
  }

  if (id.includes("/lucide-react/")) {
    return "icons";
  }

  return "vendor";
}

const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  Date.now().toString(36);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || "1.0.0"),
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: [
        "favicon.svg",
        "icons.svg",
        "kalpurush.ttf",
        "logo.png",
        "logo-dark.png",
        "android/*.png",
        "ios/*.png",
        "icons/*.png",
      ],
      manifest: {
        name: "প্রোডাক্ট ম্যানেজমেন্ট",
        short_name: "PM",
        description:
          "বাংলা প্রোডাক্ট ম্যানেজমেন্ট ও ইনভেন্টরি প্ল্যাটফর্ম",
        lang: "bn",
        dir: "ltr",
        start_url: "/login",
        scope: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait-primary",
        background_color: "#08080A",
        theme_color: "#08080A",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "/android/launchericon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "/android/launchericon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "/android/launchericon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/android/launchericon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/icons/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
        shortcuts: [
          {
            name: "ড্যাশবোর্ড",
            short_name: "হোম",
            url: "/dashboard",
            icons: [
              { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
            ],
          },
          {
            name: "প্রোডাক্ট",
            short_name: "প্রোডাক্ট",
            url: "/products",
            icons: [
              { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
            ],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2,ttf}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/__/, /^\/admin\/api/],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "cloudinary-media",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],

  /* ============================================================
     SERVER — prevents Vite from watching non-frontend folders
     (cloudflare-worker, android, dist, etc.)
     Fixes: EBUSY / crash when .crdownload or .gradle files exist
     ============================================================ */
  server: {
    watch: {
      ignored: [
        "**/cloudflare-worker/**",
        "**/android/**",
        "**/.gradle/**",
        "**/dist/**",
        "**/build/**",
        "**/node_modules/**",
        "**/.git/**",
        "**/*.crdownload",
        "**/*.tmp",
        "**/serviceAccount*.json",
        "**/sa*.json",
        "**/sa*.txt",
      ],
    },
  },

  /* Same ignore list for the production build */
  optimizeDeps: {
    entries: ["index.html"],
    exclude: ["cloudflare-worker"],
  },

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});