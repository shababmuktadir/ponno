import {
  createContext, useContext, useEffect, useMemo, useRef, useState, useCallback,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  watchAuth, fetchUserDoc, ensureUserDoc, logoutUser,
} from "@/services/firebase/authService";
import { SUPER_ADMIN_UID, ROLES, hasPermission, isStaffRole } from "@/config/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const mounted = useRef(true);

  // ---------- Bootstrap auth ----------
  useEffect(() => {
    mounted.current = true;
    let timeoutId;

    const unsub = watchAuth(async (user) => {
      if (!mounted.current) return;
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // First-time fetch (heal if missing)
      timeoutId = setTimeout(() => {
        if (mounted.current) {
          setAuthError(
            "প্রোফাইল লোড করা যাচ্ছে না। ইন্টারনেট বা Firestore Rules পরীক্ষা করুন।"
          );
          setLoading(false);
        }
      }, 10000);

      try {
        let data = await fetchUserDoc(user.uid);
        if (!data) data = await ensureUserDoc(user);
        if (mounted.current) setProfile(data);
      } catch (err) {
        if (import.meta.env.DEV) console.error("[auth bootstrap]", err);
      } finally {
        clearTimeout(timeoutId);
        if (mounted.current) setLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(timeoutId);
      unsub();
    };
  }, []);

  // ---------- Realtime listener on own user doc ----------
  useEffect(() => {
    if (!firebaseUser) return;

    const ref = doc(db, "users", firebaseUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProfile({ id: snap.id, ...snap.data() });
        } else {
          setProfile(null);
        }
      },
      (err) => {
        if (import.meta.env.DEV) console.error("[auth onSnapshot]", err);
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  // ---------- Manual refresh ----------
  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return null;
    const data = await fetchUserDoc(firebaseUser.uid);
    setProfile(data);
    return data;
  }, [firebaseUser]);

  // ---------- Context value ----------
  const value = useMemo(() => {
    const uid = firebaseUser?.uid || null;
    const isHardcodedSuper = uid === SUPER_ADMIN_UID;
    const rawRole = profile?.role || ROLES.USER;
    const role = isHardcodedSuper ? ROLES.SUPER_ADMIN : rawRole;
    const accountStatus = profile?.accountStatus || "active";

    const can = (permission) => hasPermission(role, permission);

    return {
      firebaseUser,
      profile,
      loading,
      authError,
      refreshProfile,
      isAuthenticated: Boolean(firebaseUser && profile),

      uid,
      role,
      workspaceId: profile?.workspaceId || null,
      packageId: profile?.packageId || "free",
      accountType: profile?.accountType || "free",
      accountStatus,
      subscriptionStatus: profile?.subscriptionStatus || "active",

      isSuperAdmin: isHardcodedSuper,
      isAdmin: isHardcodedSuper || role === ROLES.ADMIN,
      isModerator: isHardcodedSuper || role === ROLES.ADMIN || role === ROLES.MODERATOR,
      isEditor: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EDITOR].includes(role),
      isSupport: isStaffRole(role),
      isStaff: isStaffRole(role),
      can,

      isSuspended: accountStatus === "suspended",
      isPending: accountStatus === "pending",
      needsEmailVerification:
        Boolean(firebaseUser) && !firebaseUser.emailVerified,

      logout: logoutUser,
    };
  }, [firebaseUser, profile, loading, authError, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}