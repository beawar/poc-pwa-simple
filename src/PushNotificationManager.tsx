import React, { useState, useEffect, useCallback } from "react";

interface NotificationManagerProps {
  serverUrl?: string;
}

const PushNotificationManager: React.FC<NotificationManagerProps> = ({
  serverUrl = "http://localhost:3001",
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
      const response = await fetch(`${serverUrl}/api/vapid-key`);
      const data = await response.json();
      setVapidPublicKey(data.publicKey);
    } catch (error) {
      console.error("Error getting VAPID key:", error);
      setMessage("Error getting VAPID key");
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
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
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
      const registration = await navigator.serviceWorker.ready;

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // Send subscription to server
      const response = await fetch(`${serverUrl}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSubscription),
      });

      if (response.ok) {
        setSubscription(newSubscription);
        setIsSubscribed(true);
        setMessage("Successfully subscribed to push notifications!");
      } else {
        throw new Error("Failed to subscribe");
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      setMessage("Failed to subscribe to push notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    setIsLoading(true);
    setMessage("");

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify server
      await fetch(`${serverUrl}/api/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      setSubscription(null);
      setIsSubscribed(false);
      setMessage("Successfully unsubscribed from push notifications");
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      setMessage("Failed to unsubscribe from push notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/test-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setMessage("Test notification sent!");
      } else {
        throw new Error("Failed to send test notification");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setMessage("Failed to send test notification");
    }
  };

  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  };

  if (!isSupported) {
    return (
      <div className="push-notification-manager">
        <h3>Push Notifications</h3>
        <p>Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="push-notification-manager">
      <h3>Push Notifications</h3>

      <div className="subscription-status">
        <p>Status: {isSubscribed ? "✅ Subscribed" : "❌ Not subscribed"}</p>
        {subscription && (
          <details>
            <summary>Subscription Details</summary>
            <pre>{JSON.stringify(subscription, null, 2)}</pre>
          </details>
        )}
      </div>

      <div className="controls">
        {!isSubscribed ? (
          <button
            onClick={subscribeToPush}
            disabled={isLoading || !vapidPublicKey}
            className="subscribe-btn"
          >
            {isLoading ? "Subscribing..." : "Subscribe to Push Notifications"}
          </button>
        ) : (
          <div className="subscribed-controls">
            <button
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              className="unsubscribe-btn"
            >
              {isLoading ? "Unsubscribing..." : "Unsubscribe"}
            </button>
            <button onClick={sendTestNotification} className="test-btn">
              Send Test Notification
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`message ${
            message.includes("Error") || message.includes("Failed")
              ? "error"
              : "success"
          }`}
        >
          {message}
        </div>
      )}

      <div className="info">
        <h4>How to test:</h4>
        <ol>
          <li>Click "Subscribe to Push Notifications"</li>
          <li>Allow notifications when prompted</li>
          <li>Click "Send Test Notification" to test</li>
          <li>
            Or use the server API directly:{" "}
            <code>POST {serverUrl}/api/send-notification</code>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default PushNotificationManager;
