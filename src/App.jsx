import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontSizeProvider } from "@/context/FontSizeContext";
import { PaletteProvider } from "@/context/PaletteContext";
import { PackageProvider } from "@/context/PackageContext";
import AmbientBackground from "@/components/ui/AmbientBackground";
import UpdateNotification from "@/components/ui/UpdateNotification";
import APKUpdateNotification from "@/components/ui/APKUpdateNotification";
import AppRoutes from "@/routes/AppRoutes";
import { requestAllPermissions, isNative } from "@/services/native/permissionsService";

function AppInner() {
  /* ---------- Request all permissions once at startup (native only) ---------- */
  useEffect(() => {
    if (!isNative()) return;

    // Small delay so app renders first
    const t = setTimeout(async () => {
      try {
        const result = await requestAllPermissions();
        console.log("[Permissions]", result);
      } catch (err) {
        console.warn("[Permissions] failed:", err);
      }
    }, 1500);

    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AmbientBackground />
      <AppRoutes />
      <UpdateNotification />
      <APKUpdateNotification />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2800,
          style: {
            background: "var(--glass-bg-2)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            color: "var(--text)",
            border: "1px solid var(--glass-border)",
            borderRadius: "14px",
            boxShadow: "var(--shadow-lg)",
            fontFamily: "var(--font-bangla)",
            fontSize: "0.9rem",
            padding: "10px 14px",
          },
          success: {
            iconTheme: {
              primary: "var(--success)",
              secondary: "var(--surface-solid)",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--danger)",
              secondary: "var(--surface-solid)",
            },
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <FontSizeProvider>
            <PaletteProvider>
              <PackageProvider>
                <AppInner />
              </PackageProvider>
            </PaletteProvider>
          </FontSizeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}