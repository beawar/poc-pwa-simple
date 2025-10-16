import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Find SSL certificates in home directory
const homeDir = process.env.HOME || process.env.USERPROFILE;
const findSSLCertificates = () => {
  if (!homeDir) return null;

  const commonNames = [
    { key: "localhost-key.pem", cert: "localhost.pem" },
    { key: "localhost+1-key.pem", cert: "localhost+1.pem" },
    { key: "key.pem", cert: "cert.pem" },
    { key: "server.key", cert: "server.crt" },
  ];

  for (const { key, cert } of commonNames) {
    const keyPath = path.join(homeDir, key);
    const certPath = path.join(homeDir, cert);
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return { keyPath, certPath };
    }
  }
  return null;
};

const sslCerts = findSSLCertificates();

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // Allow external connections
    port: 5173,
    ...(sslCerts && {
      https: {
        key: fs.readFileSync(sslCerts.keyPath),
        cert: fs.readFileSync(sslCerts.certPath),
      },
    }),
  },
  preview: {
    host: true, // Allow external connections
    port: 4173,
    ...(sslCerts && {
      https: {
        key: fs.readFileSync(sslCerts.keyPath),
        cert: fs.readFileSync(sslCerts.certPath),
      },
    }),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      filename: "sw.ts",
      srcDir: "src/service-worker",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "PWA Simple App",
        short_name: "PWA Simple",
        description: "A simple Progressive Web App with installation support",
        id: "/",
        theme_color: "#667eea",
        background_color: "#ffffff",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        lang: "en",
        categories: ["productivity", "utilities"],
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "favicon-16x16.png",
            sizes: "16x16",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-192x192.png",
            sizes: "230x230",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "614x614",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "screenshot-narrow.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },
      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
});
