/**
 * Native permission helper for Capacitor Android APK.
 * Uses @capacitor/core native bridge if available,
 * falls back to browser APIs for PWA.
 */

function isNative() {
  return (
    typeof window !== "undefined" &&
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform()
  );
}

function getPlugin(name) {
  if (!isNative()) return null;
  try {
    return window.Capacitor.Plugins?.[name] || null;
  } catch {
    return null;
  }
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

export async function requestNotificationPermission() {
  // Native path
  const push = getPlugin("PushNotifications");
  if (push) {
    try {
      let perm = await push.checkPermissions();
      if (perm.receive !== "granted") {
        perm = await push.requestPermissions();
      }
      return perm.receive === "granted";
    } catch (err) {
      console.warn("[perm] native push fail:", err);
    }
  }

  // Web fallback
  if (typeof Notification !== "undefined") {
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  return false;
}

export async function checkNotificationPermission() {
  const push = getPlugin("PushNotifications");
  if (push) {
    try {
      const perm = await push.checkPermissions();
      return perm.receive || "denied";
    } catch {}
  }
  if (typeof Notification !== "undefined") {
    return Notification.permission;
  }
  return "unsupported";
}

/* ============================================================
   CAMERA
   ============================================================ */

export async function requestCameraPermission() {
  const camera = getPlugin("Camera");
  if (camera && camera.requestPermissions) {
    try {
      const result = await camera.requestPermissions({ permissions: ["camera"] });
      return result.camera === "granted";
    } catch (err) {
      console.warn("[perm] camera fail:", err);
    }
  }
  // Browser — no direct API, but getUserMedia triggers the prompt
  return true;
}

/* ============================================================
   FILES / PHOTOS
   ============================================================ */

export async function requestPhotosPermission() {
  const camera = getPlugin("Camera");
  if (camera && camera.requestPermissions) {
    try {
      const result = await camera.requestPermissions({ permissions: ["photos"] });
      return result.photos === "granted" || result.photos === "limited";
    } catch (err) {
      console.warn("[perm] photos fail:", err);
    }
  }
  return true;
}

/* ============================================================
   ALL PERMISSIONS (call on app start)
   ============================================================ */

export async function requestAllPermissions() {
  const result = {
    notifications: false,
    camera: false,
    photos: false,
  };

  try {
    result.notifications = await requestNotificationPermission();
  } catch {}

  try {
    result.camera = await requestCameraPermission();
  } catch {}

  try {
    result.photos = await requestPhotosPermission();
  } catch {}

  return result;
}

export { isNative };