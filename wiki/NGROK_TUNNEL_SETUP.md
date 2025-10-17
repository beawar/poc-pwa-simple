# Using ngrok for PWA Push Notifications 

This guide explains how to use ngrok to enable push notifications on iOS devices by exposing your local development server through a secure tunnel.
The guide is valid for android too.

## Why Use ngrok?

iOS has strict security requirements for PWAs. When you access a PWA from a local network address (like `192.168.x.x` or `dev.local`), iOS places it in a restrictive security sandbox that **disables the Push API**, even with trusted certificates.

Using ngrok creates a **public, internet-accessible HTTPS URL** with a publicly trusted SSL certificate, which iOS treats as a legitimate application and enables the Push API.

## Prerequisites

- Your PWA development server running locally
- ngrok account (free tier available)
- iOS device for testing

## Step-by-Step Setup

### 1. Install ngrok

1. **Download ngrok** from [ngrok.com/download](https://ngrok.com/download)
2. **Sign up for a free account** at [ngrok.com](https://ngrok.com)
3. **Get your authtoken** from your ngrok dashboard

### 2. Configure ngrok

Add your authtoken to ngrok:

```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 3. Start Your Local Server

Make sure your PWA development server is running:

```bash
pnpm run build
# For HTTP mode (recommended for iOS PWA icon testing)
pnpm run preview:full:http
```

Your server should be running on `http://localhost:4173`.

### 4. Start the ngrok Tunnel

Open a new terminal and run:

```bash
# For HTTP mode
ngrok http 4173
```

### 5. Get Your Public URL

ngrok will display output like this:

```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:4173
```

Copy the **Forwarding URL** (e.g., `https://abc123.ngrok-free.app`).

### 6. Test on iOS Device

1. **Open Safari** on your iPhone/iPad
2. **Navigate to the ngrok URL** (e.g., `https://abc123.ngrok-free.app`)
3. **Accept the ngrok warning** if prompted (click "Visit Site")
4. **Add to Home Screen:**
   - Tap the Share button 📤
   - Select "Add to Home Screen" ➕
   - Tap "Add"
5. **Open the PWA** from your home screen
6. **Test push notifications** - they should now work!

## Troubleshooting

### ngrok Warning Page

If you see an ngrok warning page:

1. Click "Visit Site" to proceed
2. Or add `--host-header-rewrite=localhost` to your ngrok command

### Push Notifications Still Not Working

1. **Ensure you're using the PWA** (opened from home screen, not Safari)
2. **Check the console** for any error messages
3. **Verify the ngrok URL** is accessible from your device
4. **Try refreshing** the PWA after adding to home screen

## Alternative: Using mkcert with ngrok

If you want to use your own SSL certificates with ngrok:

1. **Install mkcert:**

   ```bash
   # macOS
   brew install mkcert

   # Or download from https://github.com/FiloSottile/mkcert/releases
   ```

2. **Create locally-trusted certificates:**

   ```bash
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   ```

3. **Update your environment variables:**

   ```bash
   SSL_KEY_PATH=./localhost+2-key.pem
   SSL_CERT_PATH=./localhost+2.pem
   ```

4. **Start with HTTPS and ngrok:**
   ```bash
   pnpm run preview:full:https
   ngrok http https://localhost:4173 --host-header="localhost:4173"
   ```

## Production Deployment

For production, you don't need ngrok. Instead:

1. Deploy your PWA to a real domain with HTTPS
2. Use a proper SSL certificate (Let's Encrypt, etc.)
3. iOS will treat it as a legitimate application

## Benefits of This Approach

- ✅ **Enables push notifications** on real devices
- ✅ **Uses publicly trusted SSL** certificates
- ✅ **Works with any local development setup**
- ✅ **No complex server configuration** needed
- ✅ **Free tier available** for development

## Security Note

The ngrok URL is publicly accessible. For development, this is fine, but:

- Don't expose sensitive data
- Use ngrok's authentication features if needed
- Consider using ngrok's paid plans for better security features
