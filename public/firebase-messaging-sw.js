/* eslint-disable no-undef */
/* Firebase Cloud Messaging Service Worker */

importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB6kwtCjQlN93-1tFqXR3eljqeMTOJkGJY",
  authDomain: "walton-f48ad.firebaseapp.com",
  projectId: "walton-f48ad",
  storageBucket: "walton-f48ad.firebasestorage.app",
  messagingSenderId: "172349512009",
  appId: "1:172349512009:web:8b2eaf4c32f5275790e298",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "প্রোডাক্ট ম্যানেজমেন্ট";
  const body = payload?.notification?.body || "";
  const icon = payload?.notification?.icon || "/icons/pwa-192.png";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/icons/pwa-192.png",
    data: payload?.data || {},
    vibrate: [100, 50, 100],
    tag: payload?.data?.tag || "pm-notification",
    renotify: true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen =
    event?.notification?.data?.url || "/admin/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});