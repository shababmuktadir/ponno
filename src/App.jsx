import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontSizeProvider } from "@/context/FontSizeContext";
import AmbientBackground from "@/components/ui/AmbientBackground";
import AppRoutes from "@/routes/AppRoutes";

export default function App() {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AmbientBackground />
            <AppRoutes />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3200,
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
          </AuthProvider>
        </BrowserRouter>
      </FontSizeProvider>
    </ThemeProvider>
  );
}