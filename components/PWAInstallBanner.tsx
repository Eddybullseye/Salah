'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Share,
  PlusSquare,
  X,
  CheckCircle,
  Smartphone,
  ExternalLink,
  Bell,
  Laptop,
} from 'lucide-react';
import { isIOS, isStandalone } from '@/lib/web-push';
import { useMounted } from '@/hooks/use-mounted';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const mounted = useMounted();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const dismissedUntil = localStorage.getItem('salah_install_dismissed_until');
    return !!(dismissedUntil && Number(dismissedUntil) > Date.now());
  });
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setJustInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isIOSDevice = mounted ? isIOS() : false;
  const isAppInstalled = mounted ? isStandalone() : false;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      const sevenDays = Date.now() + 7 * 86400000;
      localStorage.setItem('salah_install_dismissed_until', String(sevenDays));
    }
  };

  const handleInstallClick = async () => {
    if (isIOSDevice) {
      setShowModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setJustInstalled(true);
          setDeferredPrompt(null);
        } else {
          handleDismiss();
        }
      } catch {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  // If already standalone installed and didn't just install, hide
  if (!mounted || isAppInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      {/* 1. Congratulatory banner if user just installed */}
      {justInstalled && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 border-b border-emerald-500 px-4 py-3 shadow-lg animate-fade-in text-white text-xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>
                <strong>Installed successfully!</strong> Enable reminders in Settings for reliable lock-screen adhans.
              </span>
            </div>
            <button
              onClick={() => setJustInstalled(false)}
              className="p-1 rounded text-emerald-200 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Alert Banner */}
      {!justInstalled && (
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
              <Link
                href="/install"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white px-2 py-1"
              >
                <span>Guide</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                onClick={handleDismiss}
                className="p-1 rounded text-emerald-400 hover:text-white transition-colors"
                aria-label="Dismiss banner for 7 days"
                title="Dismiss for 7 days"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Install Modal (iOS, Android fallback, Desktop) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-emerald-950 via-teal-950 to-emerald-950 border border-amber-500/40 p-6 shadow-2xl text-center space-y-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 text-2xl shadow-inner">
              🌙
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {isIOSDevice ? 'Add to iPhone Home Screen' : 'Install to Home Screen'}
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                {isIOSDevice
                  ? 'iOS 16.4+ requires Home Screen installation for lock-screen Web Push.'
                  : 'Fast offline access without browser address bar distractions.'}
              </p>
            </div>

            {isIOSDevice ? (
              <div className="space-y-2.5 text-left text-xs pt-1">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50">
                  <div className="w-6 h-6 rounded-lg bg-emerald-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      Tap the Share button <Share className="w-3.5 h-3.5 text-amber-400 inline" />
                    </p>
                    <p className="text-[11px] text-emerald-300/70">
                      In the bottom Safari menu bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50">
                  <div className="w-6 h-6 rounded-lg bg-emerald-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      Select &quot;Add to Home Screen&quot; <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
                    </p>
                    <p className="text-[11px] text-emerald-300/70">
                      Scroll down the menu list and tap Add.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-800/50 text-left text-xs space-y-1.5">
                <p className="font-semibold text-white">Browser Menu Installation:</p>
                <ol className="list-decimal pl-5 space-y-1 text-emerald-300/80 text-[11px]">
                  <li>Tap the <strong>three dots menu (⋮)</strong> at top right.</li>
                  <li>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                  <li>Confirm the install prompt.</li>
                </ol>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/install"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Full Install Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 text-xs text-emerald-300/70 hover:text-white"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
