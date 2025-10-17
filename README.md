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

- `pnpm run dev` - Start Vite dev server only
- `pnpm run dev:full` - Start both dev server and push notification server
- `pnpm run build` - Build the app
- `pnpm run preview` - Preview the built app
- `pnpm run preview:full` - Preview with push notification server
- `pnpm run server` - Start push notification server only
- `pnpm run start` - Build and start in production mode

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

The app is configured to work on your local network:

- Dev server: `http://YOUR_IP:5173` or `https://YOUR_IP:5173` (if SSL configured)
- Preview server: `http://YOUR_IP:4173` or `https://YOUR_IP:4173` (if SSL configured)
- Push server: `http://YOUR_IP:3001` or `https://YOUR_IP:443` (if SSL configured)

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
