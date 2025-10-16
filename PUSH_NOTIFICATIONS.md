# Push Notifications Setup

This PWA now includes push notification functionality with a custom service worker and Express server.

## Features

- ✅ Custom service worker with push notification support
- ✅ TypeScript Express server with push notification API
- ✅ VAPID key authentication
- ✅ Subscription management
- ✅ Test notification functionality
- ✅ Notification actions (View, Close)
- ✅ Client-side subscription interface
- ✅ Full TypeScript support with proper types

## Quick Start

### 1. Start the Development Environment

```bash
# Start both the PWA and push notification server
npm run dev:full

# Or start them separately:
npm run dev      # PWA on http://localhost:5173
npm run server   # TypeScript push server on http://localhost:3001
```

### 2. Test Push Notifications

1. Open the PWA in your browser (http://localhost:5173)
2. Click "Subscribe to Push Notifications"
3. Allow notifications when prompted
4. Click "Send Test Notification" to test

### 3. Send Custom Notifications

Use the server API to send custom notifications:

```bash
# Send a test notification
curl -X POST http://localhost:3001/api/test-notification

# Send a custom notification
curl -X POST http://localhost:3001/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Custom Notification",
    "body": "This is a custom message!",
    "data": {"custom": "data"}
  }'
```

## API Endpoints

| Endpoint                 | Method | Description                          |
| ------------------------ | ------ | ------------------------------------ |
| `/api/vapid-key`         | GET    | Get VAPID public key                 |
| `/api/subscribe`         | POST   | Subscribe to push notifications      |
| `/api/unsubscribe`       | POST   | Unsubscribe from push notifications  |
| `/api/send-notification` | POST   | Send notification to all subscribers |
| `/api/test-notification` | POST   | Send a test notification             |
| `/api/subscriptions`     | GET    | Get subscription count and details   |
| `/api/health`            | GET    | Health check                         |

## Service Worker Features

The custom service worker (`src/sw.ts`) includes:

- **Caching**: Automatic caching of app resources
- **Offline Support**: Serve cached content when offline
- **Push Notifications**: Handle incoming push messages
- **Notification Actions**: Support for custom notification actions
- **Background Sync**: Framework for background data sync
- **Message Handling**: Communication with main thread

## Configuration

### VAPID Keys

The server uses VAPID keys for secure push notifications:

- **Public Key**: `BApAxCNXN8M23-2wnDJM46ABlNH5e32WGL1hyIamiA4090g45Thrpim8HdgT0PtW8BQE3B8eTRm-b0oKIT4DV4E`
- **Private Key**: `lUvoxCVKXaP1WzLX2k527gw4yPR9tmgH2-LRZFOiK1A`

⚠️ **Security Note**: In production, store VAPID keys securely and use environment variables.

### Server Configuration

The TypeScript server is configured to:

- Serve the built PWA from the `dist` directory
- Accept CORS requests from the PWA
- Store subscriptions in memory (use a database in production)
- Automatically clean up invalid subscriptions
- Full TypeScript support with proper type checking

## Browser Support

Push notifications work in:

- Chrome/Edge (Chromium-based)
- Firefox
- Safari (with limitations)

## Troubleshooting

### Common Issues

1. **"Push notifications not supported"**

   - Ensure you're using HTTPS (or localhost)
   - Check browser support

2. **"Failed to subscribe"**

   - Check if VAPID key is correctly configured
   - Ensure service worker is registered

3. **"Notifications not received"**
   - Check browser notification permissions
   - Verify subscription is active
   - Check server logs for errors

### Debug Mode

Enable debug logging in the service worker by opening browser DevTools and checking the Console tab.

## Production Deployment

For production deployment:

1. **Secure VAPID Keys**: Store keys in environment variables
2. **Database**: Use a proper database for subscription storage
3. **HTTPS**: Ensure your domain uses HTTPS
4. **Error Handling**: Add comprehensive error handling
5. **Monitoring**: Add logging and monitoring

## Example Usage

```javascript
// Subscribe to push notifications
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidPublicKey,
});

// Send subscription to server
await fetch("/api/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(subscription),
});
```
