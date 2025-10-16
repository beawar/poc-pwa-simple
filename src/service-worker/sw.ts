/// <reference lib="webworker" />

// reference https://vite-pwa-org.netlify.app/guide/inject-manifest.html

import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

// cleanup outdated assets
cleanupOutdatedCaches();

// Precaching list will be injected here during build
precacheAndRoute(self.__WB_MANIFEST);

// Example: Network First strategy for HTML files
registerRoute(({ request }) => request.mode === "navigate", new NetworkFirst());

// Push notification example:
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body || "No body",
      icon: "/icon.png",
    })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
