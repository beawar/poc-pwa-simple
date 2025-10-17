# PWA Simple App

A simple Progressive Web App (PWA) with installation support and push notifications.

## Features

- ✅ PWA installation prompt for Android and iOS
- ✅ Push notifications with VAPID keys
- ✅ Service worker with Workbox
- ✅ Responsive design
- ✅ Network accessible (works on mobile devices)

## Quick Start

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start development server:**

   ```bash
   pnpm run dev:full
   ```

   This starts both the Vite dev server and the push notification server.

3. **Build and preview:**
   ```bash
   pnpm run build
   pnpm run preview:full
   ```

## Available Scripts

### Development

- `pnpm run dev` - Start Vite dev server (HTTPS if SSL configured, HTTP otherwise)
- `pnpm run dev:http` - Start Vite dev server in HTTP mode (for iOS PWA icon testing)
- `pnpm run dev:https` - Start Vite dev server in HTTPS mode (requires SSL certificates)
- `pnpm run dev:full` - Start both dev server and push notification server
- `pnpm run dev:full:http` - Start both servers in HTTP mode
- `pnpm run dev:full:https` - Start both servers in HTTPS mode

### Preview

- `pnpm run preview` - Preview the built app (HTTPS if SSL configured, HTTP otherwise)
- `pnpm run preview:http` - Preview in HTTP mode (for iOS PWA icon testing)
- `pnpm run preview:https` - Preview in HTTPS mode (requires SSL certificates)
- `pnpm run preview:full` - Preview with push notification server
- `pnpm run preview:full:http` - Preview with server in HTTP mode
- `pnpm run preview:full:https` - Preview with server in HTTPS mode

### Other

- `pnpm run build` - Build the app
- `pnpm run server` - Start push notification server only
- `pnpm run server:http` - Start server in HTTP mode
- `pnpm run server:https` - Start server in HTTPS mode
- `pnpm run start` - Build and start in production mode
- `pnpm run start:http` - Build and start in production mode HTTP
- `pnpm run start:https` - Build and start in production mode HTTPS

## PWA Installation

### Android

- The app will show an install prompt automatically
- Or use the floating install button

### iOS

- Tap the Share button 📤
- Scroll down and tap "Add to Home Screen" ➕
- Tap "Add" to confirm

## Push Notifications

The app includes a push notification system:

1. **Server:** Runs on port 3001 by default
2. **VAPID Keys:** Auto-generated for development
3. **Test:** Use the "Send Test Notification" button

## Environment Variables

This project uses [dotenvx](https://dotenvx.com/) for secure environment variable management. Create a `.env` file with:

```bash
# SSL Certificate paths (for HTTPS)
SSL_KEY_PATH=/path/to/your/private-key.pem
SSL_CERT_PATH=/path/to/your/certificate.pem

# VAPID keys for push notifications (optional - auto-generated if not set)
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

## Network Access

The app is configured to work on your local network with automatic proxy forwarding:

- **Dev server**: `http://YOUR_IP:5173` or `https://YOUR_IP:5173` (if SSL configured)
- **Preview server**: `http://YOUR_IP:4173` or `https://YOUR_IP:4173` (if SSL configured)
- **Push server**: Runs on `localhost:3001` (automatically proxied to network clients)

### Proxy Configuration

Vite automatically proxies `/api/*` requests from network clients to `localhost:3001`, so:

- When accessing from `localhost` → direct connection to `localhost:3001`
- When accessing from network IP → requests are proxied through Vite to `localhost:3001`

This ensures the push notification server is always accessible regardless of how you access the app.

## Production

For production deployment:

1. Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` environment variables
2. Set `SSL_KEY_PATH` and `SSL_CERT_PATH` for HTTPS
3. Update the server URL in `PushNotificationManager.tsx`
4. Deploy both the built app and the server

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **PWA:** vite-plugin-pwa + Workbox
- **Backend:** Express + web-push
- **Styling:** CSS
