'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle, Smartphone } from 'lucide-react';
import { isIOS, isStandalone } from '@/lib/web-push';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(() => (typeof window !== 'undefined' ? isStandalone() : false));
  const [isIOSDevice] = useState(() => (typeof window !== 'undefined' ? isIOS() : false));
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOSDevice) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsAppInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // General instructions modal
      setShowIOSModal(true);
    }
  };

  // If already installed or dismissed, do not display banner
  if (isAppInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Non-intrusive Top Alert Banner */}
      <div className="bg-gradient-to-r from-emerald-900/95 via-teal-900/90 to-emerald-950/95 border-b border-amber-500/30 px-4 py-2.5 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <p className="text-emerald-100 truncate">
              <span className="font-semibold text-white">Install Salah Companion</span> for lock-screen prayer notifications & offline access.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 font-semibold shadow-sm transition-all active:scale-95 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-emerald-400 hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Guided Step-by-Step iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-emerald-950 to-teal-950 p-6 shadow-2xl border border-amber-500/40 text-slate-100">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-800/60 border border-amber-500/40 flex items-center justify-center mb-3 shadow-inner">
                <span className="text-2xl">🌙</span>
              </div>
              <h3 className="text-lg font-bold text-white">Install on iPhone & iPad</h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                Apple requires Home Screen installation (iOS 16.4+) to enable Web Push notifications.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/40">
                <div className="p-2 rounded-lg bg-emerald-800 text-amber-400 font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    Tap the Share button <Share className="w-3.5 h-3.5 text-amber-400 inline" />
                  </p>
                  <p className="text-emerald-200/70 text-[11px] mt-0.5">
                    Look for the share icon at the bottom of Safari (or top right on iPad).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/40">
                <div className="p-2 rounded-lg bg-emerald-800 text-amber-400 font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    Select &quot;Add to Home Screen&quot; <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
                  </p>
                  <p className="text-emerald-200/70 text-[11px] mt-0.5">
                    Scroll down in the action sheet until you see &quot;Add to Home Screen&quot;.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/40">
                <div className="p-2 rounded-lg bg-emerald-800 text-amber-400 font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Open from your Home Screen</p>
                  <p className="text-emerald-200/70 text-[11px] mt-0.5">
                    Launch the app from the new icon, then enable push notifications with one tap!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-xs shadow-md transition-all active:scale-[0.98]"
            >
              Got it, let&apos;s pray!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
