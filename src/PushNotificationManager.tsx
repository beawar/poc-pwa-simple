import React, { useState, useEffect, useCallback } from "react";

interface NotificationManagerProps {
  serverUrl?: string;
}

// Function to get the appropriate server URL based on environment
function getServerUrl(): string {
  const isHTTPS = window.location.protocol === "https:";
  const port = isHTTPS ? "443" : "3001";
  const protocol = isHTTPS ? "https:" : "http:";

  // If we're running on localhost, use localhost
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `${protocol}//localhost:${port}`;
  }

  // If we're running on the network, use relative URLs so Vite proxy can handle them
  // The proxy will forward /api requests to localhost:3001
  return "";
}

const PushNotificationManager: React.FC<NotificationManagerProps> = ({
  serverUrl = getServerUrl(),
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [vapidPublicKey, setVapidPublicKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const getVapidKey = useCallback(async () => {
    try {
      const url = `${serverUrl}/api/vapid-key`;
      console.log(`🔍 Fetching VAPID key from: ${url}`);
      console.log(
        `🔍 Server URL: "${serverUrl}" (empty means using relative URLs with proxy)`
      );

      const response = await fetch(`${serverUrl}/api/vapid-key`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ VAPID key received:", data.publicKey);
      setVapidPublicKey(data.publicKey);
      setMessage("VAPID key loaded successfully");
    } catch (error) {
      console.error("❌ Error getting VAPID key:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setMessage(`Failed to get VAPID key: ${errorMessage}`);
    }
  }, [serverUrl]);

  useEffect(() => {
    // Check if push notifications are supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscriptionStatus();
      getVapidKey();
    }
  }, [getVapidKey]);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        setIsSubscribed(!!sub);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const subscribeToPush = async () => {
    if (!vapidPublicKey) {
      setMessage("VAPID key not available");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error("Service worker not registered");
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const response = await fetch(`${serverUrl}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sub),
      });

      if (response.ok) {
        setSubscription(sub);
        setIsSubscribed(true);
        setMessage("Successfully subscribed to push notifications!");
      } else {
        throw new Error("Failed to save subscription");
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      setMessage(
        `Failed to subscribe: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    setIsLoading(true);
    setMessage("");

    try {
      await subscription.unsubscribe();

      // Remove subscription from server
      await fetch(`${serverUrl}/api/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setSubscription(null);
      setIsSubscribed(false);
      setMessage("Successfully unsubscribed from push notifications");
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      setMessage(
        `Failed to unsubscribe: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/test-notification`, {
        method: "GET",
      });

      if (response.ok) {
        setMessage("Test notification sent!");
      } else {
        throw new Error("Failed to send test notification");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setMessage(
        `Failed to send test notification: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!isSupported) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Push Notifications</h2>

      {message && (
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            backgroundColor:
              message.includes("Error") || message.includes("Failed")
                ? "#fee"
                : "#efe",
            border: `1px solid ${
              message.includes("Error") || message.includes("Failed")
                ? "#fcc"
                : "#cfc"
            }`,
            borderRadius: "4px",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ margin: "20px 0" }}>
        {isSubscribed ? (
          <div>
            <p>✅ You are subscribed to push notifications!</p>
            <button
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              style={{
                padding: "10px 20px",
                margin: "5px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {isLoading ? "Unsubscribing..." : "Unsubscribe"}
            </button>
            <button
              onClick={sendTestNotification}
              style={{
                padding: "10px 20px",
                margin: "5px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Send Test Notification
            </button>
          </div>
        ) : (
          <div>
            <p>Subscribe to receive push notifications</p>
            <button
              onClick={subscribeToPush}
              disabled={isLoading || !vapidPublicKey}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {isLoading ? "Subscribing..." : "Subscribe to Notifications"}
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: "12px", color: "#666", marginTop: "20px" }}>
        <p>Server: {serverUrl}</p>
        <p>VAPID Key: {vapidPublicKey ? "✅ Loaded" : "❌ Not loaded"}</p>
      </div>
    </div>
  );
};

export default PushNotificationManager;
