import { useState, useEffect } from "react";
import "./PWAInstallPrompt.css";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [userEngaged, setUserEngaged] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsStandalone(standalone);

    // Debug PWA criteria
    const checkPWACriteria = async () => {
      console.log("🔍 PWA Installability Check:");
      console.log("  - User Agent:", navigator.userAgent);
      console.log("  - Is iOS:", iOS);
      console.log("  - Is Android:", isAndroid);
      console.log("  - Is Chrome:", isChrome);
      console.log("  - Is Standalone:", standalone);
      console.log("  - Protocol:", location.protocol);
      console.log("  - Hostname:", location.hostname);

      // Check manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      console.log("  - Manifest link:", !!manifestLink);
      if (manifestLink) {
        console.log("  - Manifest href:", manifestLink.getAttribute("href"));
      }

      // Check service worker
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          console.log("  - Service Worker registered:", !!registration);
          console.log(
            "  - Service Worker controlling:",
            !!(registration && registration.active)
          );
          console.log("  - Service Worker state:", registration?.active?.state);

          // If service worker is not controlling, wait and check again
          if (registration && !registration.active) {
            console.log("  - Service Worker not active, waiting...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const updatedRegistration =
              await navigator.serviceWorker.getRegistration();
            console.log(
              "  - Service Worker controlling (retry):",
              !!(updatedRegistration && updatedRegistration.active)
            );
            console.log(
              "  - Service Worker state (retry):",
              updatedRegistration?.active?.state
            );
          }
        } catch (error) {
          console.log("  - Service Worker error:", error);
        }
      } else {
        console.log("  - Service Worker not supported");
      }

      // Check icons
      const icons = document.querySelectorAll('link[rel="icon"]');
      console.log("  - Icon links found:", icons.length);

      // Check if HTTPS or localhost
      const isSecure =
        location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";
      console.log("  - Is secure context:", isSecure);
    };

    // Wait a bit for service worker to fully activate
    setTimeout(checkPWACriteria, 1000);

    // Track user engagement for Android
    const handleUserEngagement = () => {
      if (!userEngaged) {
        console.log("👆 User engaged with the site");
        setUserEngaged(true);
      }
    };

    // Add event listeners for user engagement
    document.addEventListener("click", handleUserEngagement);
    document.addEventListener("scroll", handleUserEngagement);
    document.addEventListener("keydown", handleUserEngagement);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("🔔 beforeinstallprompt event fired");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, show instructions after a delay
    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome, show manual prompt if beforeinstallprompt doesn't fire
    if (isAndroid && isChrome && !standalone) {
      const timer = setTimeout(() => {
        console.log(
          "🤖 Android: beforeinstallprompt didn't fire, showing manual prompt"
        );
        setShowInstallPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      document.removeEventListener("click", handleUserEngagement);
      document.removeEventListener("scroll", handleUserEngagement);
      document.removeEventListener("keydown", handleUserEngagement);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if already installed or dismissed
  if (
    isStandalone ||
    localStorage.getItem("pwa-install-dismissed") === "true"
  ) {
    return null;
  }

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-prompt" role="dialog">
      <div className="pwa-prompt-content">
        <div className="pwa-prompt-header">
          <h3>Install App</h3>
          <button className="pwa-close-btn" onClick={handleDismiss}>
            ×
          </button>
        </div>

        <div className="pwa-prompt-body">
          {isIOS ? (
            <div className="pwa-ios-instructions">
              <p>To install this app on your iOS device:</p>
              <ol>
                <li>
                  Tap the Share button <span className="pwa-icon">📤</span>
                </li>
                <li>
                  Scroll down and tap "Add to Home Screen"{" "}
                  <span className="pwa-icon">➕</span>
                </li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          ) : (
            <div className="pwa-android-instructions">
              <p>Install this app for a better experience!</p>
              <button className="pwa-install-btn" onClick={handleInstallClick}>
                Install App
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
