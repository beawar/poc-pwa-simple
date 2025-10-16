import cors from "cors";
import express, { Request, Response } from "express";
import path from "path";
import webpush from "web-push";

const app = express();
const PORT = process.env.PORT || 3001;

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
  actions: Array<{
    action: string;
    title: string;
    icon: string;
  }>;
  vibrate: number[];
  requireInteraction: boolean;
  silent: boolean;
}

interface NotificationRequest {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon: string;
  }>;
}

interface SendNotificationResponse {
  success: boolean;
  sent: number;
  total: number;
  results: Array<{
    success: boolean;
    endpoint: string;
    error?: string;
  }>;
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

// VAPID keys (in production, store these securely)
const vapidKeys: VapidKeys = {
  publicKey:
    "BApAxCNXN8M23-2wnDJM46ABlNH5e32WGL1hyIamiA4090g45Thrpim8HdgT0PtW8BQE3B8eTRm-b0oKIT4DV4E",
  privateKey: "lUvoxCVKXaP1WzLX2k527gw4yPR9tmgH2-LRZFOiK1A",
};

// Configure web-push
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Store subscriptions (in production, use a database)
const subscriptions: PushSubscription[] = [];

// Routes
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Get VAPID public key
app.get("/api/vapid-key", (req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to push notifications
app.post("/api/subscribe", (req: Request, res: Response) => {
  const subscription: PushSubscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  // Check if subscription already exists
  const existingIndex = subscriptions.findIndex(
    (sub) => sub.endpoint === subscription.endpoint
  );

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = subscription;
  } else {
    subscriptions.push(subscription);
  }

  console.log("New subscription added:", subscription.endpoint);
  res.json({ success: true, count: subscriptions.length });
});

// Unsubscribe from push notifications
app.post("/api/unsubscribe", (req: Request, res: Response) => {
  const subscription: PushSubscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  const index = subscriptions.findIndex(
    (sub) => sub.endpoint === subscription.endpoint
  );

  if (index >= 0) {
    subscriptions.splice(index, 1);
    console.log("Subscription removed:", subscription.endpoint);
    res.json({ success: true, count: subscriptions.length });
  } else {
    res.status(404).json({ error: "Subscription not found" });
  }
});

// Send push notification to all subscribers
app.post("/api/send-notification", async (req: Request, res: Response) => {
  const { title, body, icon, badge, data, actions }: NotificationRequest =
    req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const payload: NotificationPayload = {
    title: title || "PWA Simple Notification",
    body: body || "You have a new notification!",
    icon: icon || "/favicon.svg",
    badge: badge || "/favicon.svg",
    data: data || { timestamp: Date.now() },
    actions: actions || [
      {
        action: "view",
        title: "View",
        icon: "/favicon.svg",
      },
      {
        action: "close",
        title: "Close",
        icon: "/favicon.svg",
      },
    ],
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false,
  };

  const results: Array<{
    success: boolean;
    endpoint: string;
    error?: string;
  }> = [];

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      results.push({ success: true, endpoint: subscription.endpoint });
      console.log("Notification sent to:", subscription.endpoint);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error sending notification:", error);
      results.push({
        success: false,
        endpoint: subscription.endpoint,
        error: errorMessage,
      });

      // Remove invalid subscriptions
      if (
        error instanceof Error &&
        "statusCode" in error &&
        error.statusCode === 410
      ) {
        const index = subscriptions.findIndex(
          (sub) => sub.endpoint === subscription.endpoint
        );
        if (index >= 0) {
          subscriptions.splice(index, 1);
          console.log("Removed invalid subscription:", subscription.endpoint);
        }
      }
    }
  }

  const response: SendNotificationResponse = {
    success: true,
    sent: results.filter((r) => r.success).length,
    total: subscriptions.length,
    results,
  };

  res.json(response);
});

// Get subscription count
app.get("/api/subscriptions", (req: Request, res: Response) => {
  res.json({ count: subscriptions.length, subscriptions });
});

// Test endpoint to send a sample notification
app.post("/api/test-notification", async (req: Request, res: Response) => {
  const testPayload: NotificationRequest = {
    title: "Test Notification",
    body: "This is a test notification from your PWA!",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: {
      timestamp: Date.now(),
      type: "test",
    },
    actions: [
      {
        action: "view",
        title: "View App",
        icon: "/favicon.svg",
      },
      {
        action: "close",
        title: "Dismiss",
        icon: "/favicon.svg",
      },
    ],
  };

  try {
    const result = await fetch("http://localhost:3001/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const data: SendNotificationResponse = await result.json();
    res.json(data);
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

app.listen(PORT, () => {
  console.log(`🚀 Push notification server running on port ${PORT}`);
  console.log(`📱 VAPID Public Key: ${vapidKeys.publicKey}`);
  console.log(`🔗 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `🧪 Test notification: http://localhost:${PORT}/api/test-notification`
  );
});

// const httpsServer = https.createServer(
//   {
//     key: fs.readFileSync("/Users/beatrice/localhost-key.pem"),
//     cert: fs.readFileSync("/Users/beatrice/localhost.pem"),
//   },
//   app
// );

// httpsServer.listen(PORT, () => {
//   console.log(`🚀 Push notification server running on port ${PORT}`);
//   console.log(`📱 VAPID Public Key: ${vapidKeys.publicKey}`);
//   console.log(`🔗 Server URL: http://localhost:${PORT}`);
//   console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
//   console.log(
//     `🧪 Test notification: http://localhost:${PORT}/api/test-notification`
//   );
// });
