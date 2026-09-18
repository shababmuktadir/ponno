import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  increment,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

/* ============================================================
   FIRESTORE INITIALIZATION
   ------------------------------------------------------------
   অনেক ISP (বিশেষ করে বাংলাদেশে) Firestore-এর WebChannel/QUIC
   stream block করে, ফলে ERR_QUIC_PROTOCOL_ERROR / ERR_NAME_NOT_RESOLVED
   আসে এবং সব query slow হয়ে যায়।

   সমাধান:
   - experimentalAutoDetectLongPolling: true → auto switch to long-polling
   - যদি এখনো কাজ না করে, .env এ VITE_FIRESTORE_FORCE_LONG_POLLING=true দাও
   - persistentLocalCache → offline-first, second visit এ instant
   ============================================================ */

const FORCE_LONG_POLLING =
  String(import.meta.env.VITE_FIRESTORE_FORCE_LONG_POLLING || "").toLowerCase() ===
  "true";

const baseSettings = {
  localCache: (() => {
    try {
      return persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      });
    } catch {
      return memoryLocalCache();
    }
  })(),
  experimentalAutoDetectLongPolling: true,
  experimentalForceLongPolling: FORCE_LONG_POLLING,
  ignoreUndefinedProperties: true,
  useFetchStreams: false,
};

let _db;
try {
  _db = initializeFirestore(app, baseSettings);
} catch {
  _db = getFirestore(app);
}
export const db = _db;

setPersistence(auth, browserLocalPersistence).catch(() => {});

/* ============================================================
   DEV CONSOLE HELPERS
   ============================================================ */
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__fb = {
    app,
    auth,
    db,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where,
    addDoc,
    deleteDoc,
    serverTimestamp,
    onSnapshot,
    writeBatch,
    increment,
    async read(...path) {
      const ref = doc(db, ...path);
      const snap = await getDoc(ref);
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    async me() {
      const uid = auth.currentUser?.uid;
      if (!uid) return null;
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
  };
  // eslint-disable-next-line no-console
  console.info(
    `%c[Firebase] Dev helpers ready: window.__fb  (LongPolling: ${
      FORCE_LONG_POLLING ? "FORCED" : "AUTO"
    })`,
    "color:#22c55e;font-weight:bold;"
  );
}