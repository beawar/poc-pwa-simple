import cors from "cors";
import express, { Request, Response } from "express";
import webpush from "web-push";
import fs from "fs";
import path from "path";
import https from "https";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Types
interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  data: Record<string, unknown>;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  subscriptions: number;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("dist"));

// VAPID keys (replace with your generated keys)
const vapidKeys: VapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY",
  privateKey: process.env.VAPID_PRIVATE_KEY || "YOUR_VAPID_PRIVATE_KEY",
};

if (vapidKeys.publicKey === "YOUR_VAPID_PUBLIC_KEY") {
  console.warn(
    "⚠️  VAPID keys are not set. Generating new ones for development."
  );
  const newVapidKeys = webpush.generateVAPIDKeys();
  vapidKeys.publicKey = newVapidKeys.publicKey;
  vapidKeys.privateKey = newVapidKeys.privateKey;
  console.warn(
    `   New Public Key: ${vapidKeys.publicKey}\n   New Private Key: ${vapidKeys.privateKey}`
  );
  console.warn(
    "   Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables in production."
  );
}

webpush.setVapidDetails(
  "mailto:example@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const subscriptions: PushSubscription[] = [];

// Routes
app.get("/api/vapid-key", (req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/api/subscribe", (req: Request, res: Response) => {
  const subscription: PushSubscription = req.body;
  subscriptions.push(subscription);
  console.log("✅ Subscription received:", subscription);
  res.status(201).json({ message: "Subscription received" });
});

app.post("/api/unsubscribe", (req: Request, res: Response) => {
  const { endpoint } = req.body;
  const index = subscriptions.findIndex((sub) => sub.endpoint === endpoint);
  if (index > -1) {
    subscriptions.splice(index, 1);
    console.log("❌ Subscription removed:", endpoint);
    res.status(200).json({ message: "Subscription removed" });
  } else {
    res.status(404).json({ message: "Subscription not found" });
  }
});

app.post("/api/send-notification", async (req: Request, res: Response) => {
  const payload: NotificationPayload = req.body;
  console.log("Sending notification with payload:", payload);

  const notificationPromises = subscriptions.map((subscription) =>
    webpush
      .sendNotification(subscription, JSON.stringify(payload))
      .catch((error) => {
        console.error("Error sending notification:", error);
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          const index = subscriptions.findIndex(
            (sub) => sub.endpoint === subscription.endpoint
          );
          if (index > -1) {
            subscriptions.splice(index, 1);
            console.log("Removed expired subscription:", subscription.endpoint);
          }
        }
        return { endpoint: subscription.endpoint, error: error.message };
      })
  );

  const results = await Promise.allSettled(notificationPromises);
  const failed = results.filter(
    (result) =>
      result.status === "rejected" ||
      (result.status === "fulfilled" && result.value && result.value.error)
  );

  if (failed.length > 0) {
    res.status(500).json({
      message: "Failed to send some notifications",
      failed: failed.map((f: any) => f.reason || f.value),
    });
  } else {
    res.status(200).json({ message: "Notifications sent successfully" });
  }
});

app.get("/api/test-notification", async (req: Request, res: Response) => {
  const testPayload: NotificationPayload = {
    title: "Test Notification",
    body: "This is a test push notification from your server!",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: {
      url: "/",
    },
  };

  try {
    await Promise.all(
      subscriptions.map((subscription) =>
        webpush.sendNotification(subscription, JSON.stringify(testPayload))
      )
    );
    res
      .status(200)
      .json({ message: "Test notification sent to all subscribers" });
  } catch {
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  const response: HealthResponse = {
    status: "OK",
    timestamp: new Date().toISOString(),
    subscriptions: subscriptions.length,
  };
  res.json(response);
});

// Find SSL certificates
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

// Start HTTP server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Push notification server running on port ${PORT}`);
  console.log(`📱 VAPID Public Key: ${vapidKeys.publicKey}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `🧪 Test notification: http://localhost:${PORT}/api/test-notification`
  );
});

// Start HTTPS server if certificates found
if (sslCerts) {
  const httpsServer = https.createServer(
    {
      key: fs.readFileSync(sslCerts.keyPath),
      cert: fs.readFileSync(sslCerts.certPath),
    },
    app
  );

  httpsServer.listen(443, "0.0.0.0", () => {
    console.log(`🔐 HTTPS Push notification server running on port 443`);
    console.log(`📱 VAPID Public Key: ${vapidKeys.publicKey}`);
    console.log(`🔗 Local URL: https://localhost:443`);
    console.log(`🌐 Network URL: https://192.168.3.37:443`);
    console.log(`📊 Health check: https://192.168.3.37:443/api/health`);
    console.log(
      `🧪 Test notification: https://192.168.3.37:443/api/test-notification`
    );
  });
} else {
  console.log("⚠️  No SSL certificates found. HTTPS server not started.");
}
