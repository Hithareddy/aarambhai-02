import { useEffect, useState } from "react";
import { Wifi, WifiOff, Download, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

export function PwaManager() {
  const { t } = useLanguage();
  const [isOffline, setIsOffline] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // 1. Network status listeners
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 2. Install Prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 3. Service Worker registration & update detection
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        setSwRegistration(reg);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      }).catch((err) => {
        console.warn("Service Worker registration failed:", err);
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleUpdateClick = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {/* Offline Toast */}
      {isOffline && (
        <div className="pointer-events-auto flex items-center gap-3 p-3 bg-amber-600 text-white rounded-2xl shadow-xl border border-amber-500 text-xs font-bold animate-in slide-in-from-bottom-2">
          <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
          <span>{t("pwa.offlineMessage") || "You are currently offline. Safe cached content remains available."}</span>
        </div>
      )}

      {/* Online Restored Toast */}
      {showOnlineToast && !isOffline && (
        <div className="pointer-events-auto flex items-center gap-3 p-3 bg-emerald-600 text-white rounded-2xl shadow-xl border border-emerald-500 text-xs font-bold animate-in slide-in-from-bottom-2">
          <Wifi className="h-4 w-4 shrink-0" />
          <span>{t("pwa.onlineMessage") || "Internet connection restored."}</span>
        </div>
      )}

      {/* Software Update Toast */}
      {updateAvailable && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-primary text-primary-foreground rounded-2xl shadow-xl border border-primary/20 text-xs font-bold animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
            <span>{t("pwa.updateAvailable") || "A new version of Aarambh AI is available."}</span>
          </div>
          <Button onClick={handleUpdateClick} size="sm" variant="secondary" className="rounded-xl font-bold text-xs h-8 px-3">
            {t("pwa.updateNow") || "Update"}
          </Button>
        </div>
      )}

      {/* Tasteful PWA Install Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-card border border-border text-foreground rounded-2xl shadow-2xl text-xs font-bold animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2.5">
            <Download className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="block font-black">{t("pwa.installTitle") || "Install Aarambh AI App"}</span>
              <span className="text-[10px] text-muted-foreground font-normal block">{t("pwa.installDesc") || "Install for faster access & offline support"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button onClick={handleInstallClick} size="sm" className="rounded-xl font-bold text-xs h-8 px-3">
              {t("pwa.installButton") || "Install"}
            </Button>
            <Button onClick={() => setShowInstallBanner(false)} variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
