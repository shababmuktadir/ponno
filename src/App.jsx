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

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <FontSizeProvider>
            <PaletteProvider>
              <PackageProvider>
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
                  }}
                />
              </PackageProvider>
            </PaletteProvider>
          </FontSizeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}