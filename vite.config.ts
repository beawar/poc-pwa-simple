import react from "@vitejs/plugin-react";
import fs from "fs";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Find SSL certificates from environment variables
const findSSLCertificates = (env: Record<string, string>) => {
  const keyPath = env.SSL_KEY_PATH;
  const certPath = env.SSL_CERT_PATH;

  if (
    keyPath &&
    certPath &&
    fs.existsSync(keyPath) &&
    fs.existsSync(certPath)
  ) {
    return { keyPath, certPath };
  }
  return null;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), "");

  console.log(`🔍 Loading environment for mode: ${mode}`);
  console.log(`🔍 SSL_KEY_PATH: ${env.SSL_KEY_PATH || "not set"}`);
  console.log(`🔍 SSL_CERT_PATH: ${env.SSL_CERT_PATH || "not set"}`);

  const sslCerts = findSSLCertificates(env);

  if (sslCerts) {
    console.log(`🔐 SSL certificates found:`);
    console.log(`   Key: ${sslCerts.keyPath}`);
    console.log(`   Cert: ${sslCerts.certPath}`);
    console.log(`   HTTPS enabled for development and preview servers`);
  } else {
    console.log(`⚠️  No SSL certificates found. Running in HTTP mode.`);
    console.log(
      `   To enable HTTPS, set SSL_KEY_PATH and SSL_CERT_PATH environment variables`
    );
  }

  return {
    server: {
      host: true, // Allow external connections
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
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
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
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
              src: "apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "apple-touch-icon-152x152.png",
              sizes: "152x152",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "apple-touch-icon-167x167.png",
              sizes: "167x167",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "apple-touch-icon-180x180.png",
              sizes: "180x180",
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
  };
});
