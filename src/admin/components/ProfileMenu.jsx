import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import { motion } from "framer-motion";
import {
  ChevronDown, LogOut, User as UserIcon, Settings, ShieldCheck, Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/config/roles";
import { cn } from "@/utils/cn";

function initials(name, email) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export default function ProfileMenu({ compact = false }) {
  const { profile, role, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const name = profile?.name || "ব্যবহারকারী";
  const email = profile?.email || "";
  const roleLabel = ROLE_LABELS[role] || role || "ইউজার";
  const letters = initials(name, email);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "group flex items-center gap-2 rounded-[12px] border border-line bg-surface/60 px-2 py-1.5 backdrop-blur-md transition-all",
          "hover:border-line-strong hover:bg-surface/80",
          compact ? "pr-1.5" : "pr-2.5"
        )}
      >
        <span
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-semibold",
            isSuperAdmin
              ? "bg-gradient-to-br from-accent-strong to-accent text-accent-fg"
              : "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
          )}
        >
          {letters}
          {isSuperAdmin && (
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger ring-2 ring-bg">
              <ShieldCheck className="h-2 w-2 text-white" />
            </span>
          )}
        </span>

        {!compact && (
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-[140px] truncate text-[12px] font-medium text-ink">
              {name}
            </span>
            <span className="block max-w-[140px] truncate text-[10px] text-muted">
              {roleLabel}
            </span>
          </span>
        )}

        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 260,
              borderRadius: "16px",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-bg-2)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
              color: "var(--text)",
            },
          },
        }}
      >
        {/* User header */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-sm font-bold",
                isSuperAdmin
                  ? "bg-gradient-to-br from-accent-strong to-accent text-accent-fg"
                  : "bg-ink text-bg dark:bg-accent dark:text-accent-fg"
              )}
            >
              {letters}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted">
                <Mail className="h-3 w-3" />
                {email || "ইমেইল নেই"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                isSuperAdmin
                  ? "border-accent-strong bg-accent/25 text-accent-fg"
                  : role === "admin"
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : role === "moderator"
                  ? "border-warning/40 bg-warning/10 text-warning"
                  : role === "editor"
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-line bg-surface-2 text-muted"
              )}
            >
              {roleLabel}
            </span>
            {profile?.uid && (
              <span className="truncate text-[10px] text-subtle">
                <code>{profile.uid.slice(0, 12)}…</code>
              </span>
            )}
          </div>
        </motion.div>

        <Divider sx={{ borderColor: "var(--border)" }} />

        <MenuItem
          component={Link}
          to="/admin/settings"
          onClick={handleClose}
          sx={menuItemSx}
        >
          <UserIcon className="mr-3 h-4 w-4" /> প্রোফাইল
        </MenuItem>

        <MenuItem
          component={Link}
          to="/admin/settings"
          onClick={handleClose}
          sx={menuItemSx}
        >
          <Settings className="mr-3 h-4 w-4" /> সেটিংস
        </MenuItem>

        <Divider sx={{ borderColor: "var(--border)" }} />

        <MenuItem onClick={handleLogout} sx={menuItemSx}>
          <LogOut className="mr-3 h-4 w-4 text-danger" />
          <span className="text-danger">লগআউট</span>
        </MenuItem>
      </Menu>
    </>
  );
}

const menuItemSx = {
  fontSize: 13,
  py: 1.2,
  color: "var(--text)",
  "&:hover": { background: "var(--surface-2)" },
};