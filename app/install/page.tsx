'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  Smartphone,
  ChevronLeft,
  Bell,
  BatteryCharging,
  Sliders,
  Send,
  Sparkles,
  Info,
  Check,
  Laptop,
} from 'lucide-react';
import { isIOS, isStandalone, sendInstantTestNotification, subscribeToPush } from '@/lib/web-push';
import { useMounted } from '@/hooks/use-mounted';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const mounted = useMounted();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isStandalone();
  });
  const [installSuccess, setInstallSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'android_chrome' | 'android_firefox' | 'ios' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'android_chrome';
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) {
      return /firefox/.test(ua) ? 'android_firefox' : 'android_chrome';
    }
    return 'desktop';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const handleSendTestNotification = async () => {
    setTestStatus('Sending test notification...');
    const ok = await sendInstantTestNotification();
    if (ok) {
      setTestStatus('✓ Notification sent! Check your notification tray & lock screen.');
      setTimeout(() => setTestStatus(null), 5000);
    } else {
      setTestStatus('Please click "Enable Reminders" to grant permission first.');
    }
  };

  const handleEnableReminders = async () => {
    setTestStatus('Requesting push permissions...');
    const res = await subscribeToPush(undefined, 'guest', 'My Mobile Device');
    if (res.success) {
      setTestStatus('✓ Notifications enabled successfully!');
      setTimeout(() => setTestStatus(null), 4000);
    } else {
      setTestStatus(`Error: ${res.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 islamic-pattern flex flex-col justify-between text-white p-4 sm:p-6 selection:bg-amber-500 selection:text-emerald-950">
      {/* Top Header */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors p-2 rounded-lg bg-emerald-900/40 border border-emerald-800/40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        <div className="text-right">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Install App
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl w-full mx-auto my-6 space-y-6">
        {/* Banner Card */}
        <div className="rounded-3xl bg-gradient-to-b from-emerald-900/90 via-teal-950 to-emerald-950 border border-amber-500/40 p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-800/40 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
            🌙
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Install Salah Companion
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-md mx-auto leading-relaxed">
              Fast, distraction-free prayer times, adhan audio, and reliable notifications directly on your device home screen.
            </p>
          </div>

          {/* Installed Success Banner */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-800/50 border border-emerald-500 text-left space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Installed Successfully!</span>
              </div>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                Salah Companion is installed as a standalone app. You can now launch it directly from your home screen or app drawer.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-emerald-950 font-bold text-xs shadow-md"
                >
                  Open Dashboard
                </Link>
                <button
                  onClick={handleSendTestNotification}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs"
                >
                  Verify Notifications
                </button>
              </div>
            </div>
          ) : deferredPrompt ? (
            /* Chromium One-Tap Install Button */
            <div className="space-y-3">
              <button
                onClick={handleInstallClick}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>Install Salah Companion to Device</span>
              </button>
              <p className="text-[11px] text-emerald-300/70">
                Installs instantly with zero download wait time
              </p>
            </div>
          ) : null}

          {/* Platform-Tailored Installation Guide */}
          <div className="text-left space-y-4 pt-2 border-t border-emerald-800/40">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Step-by-Step Installation Instructions</span>
            </h3>

            {/* Android Chrome / Edge / Samsung Internet */}
            {platform === 'android_chrome' && (
              <div className="space-y-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-800/50 space-y-1.5">
                  <p className="font-semibold text-amber-300">Option 1: Using Chrome / Samsung Internet Menu</p>
                  <ol className="list-decimal pl-5 space-y-1 text-emerald-200/80 text-[11px] leading-relaxed">
                    <li>Tap the <strong>three dots menu (⋮)</strong> at the top right of your browser.</li>
                    <li>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                    <li>Confirm the prompt. The app icon will be added to your home screen!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Android Firefox */}
            {platform === 'android_firefox' && (
              <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-800/50 space-y-1.5 text-xs">
                <p className="font-semibold text-amber-300">Android Firefox Steps:</p>
                <ol className="list-decimal pl-5 space-y-1 text-emerald-200/80 text-[11px] leading-relaxed">
                  <li>Tap the <strong>three dots menu (⋮)</strong> next to the address bar.</li>
                  <li>Tap <strong>&quot;Install&quot;</strong>.</li>
                  <li>Tap <strong>&quot;Add to Home screen&quot;</strong> to confirm.</li>
                </ol>
              </div>
            )}

            {/* iOS Safari */}
            {platform === 'ios' && (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50">
                  <div className="w-6 h-6 rounded-lg bg-emerald-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      Tap the Share button <Share className="w-3.5 h-3.5 text-amber-400 inline" />
                    </p>
                    <p className="text-[11px] text-emerald-300/70">
                      Located in the bottom Safari toolbar on iPhone (or top bar on iPad).
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
                      Scroll down the action sheet and tap <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50">
                  <div className="w-6 h-6 rounded-lg bg-emerald-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Launch from Home Screen</p>
                    <p className="text-[11px] text-emerald-300/70">
                      Launch Salah Companion from your home screen for full iOS 16.4+ Web Push capability!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Chrome / Edge */}
            {platform === 'desktop' && (
              <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-800/50 space-y-1.5 text-xs">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4" />
                  <span>Desktop Chrome / Edge / Brave:</span>
                </p>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  Look for the <strong>Install icon</strong> in your browser&apos;s address bar (on the right side next to the bookmark star). Click it and select <strong>&quot;Install&quot;</strong> to run as an independent desktop window!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Android Reliable Reminders Guide */}
        <div className="rounded-3xl bg-emerald-950/80 border border-emerald-800/50 p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-800/40">
            <BatteryCharging className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Reliable Background Reminders on Android
            </h2>
          </div>

          <p className="text-xs text-emerald-200/70 leading-relaxed">
            Some Android manufacturers (Samsung, Xiaomi, Oppo, Vivo, OnePlus) enforce aggressive battery killers that can suppress or delay background adhan notifications. Apply these recommended settings:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 space-y-1">
              <span className="font-bold text-white block">1. Set Battery to &quot;Unrestricted&quot;</span>
              <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                Settings → Apps → Chrome (or Salah Companion) → Battery → Choose <strong>Unrestricted</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 space-y-1">
              <span className="font-bold text-white block">2. Disable &quot;Pause App If Unused&quot;</span>
              <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                In App info, ensure <em>&quot;Remove permissions and free up space&quot;</em> is turned <strong>OFF</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 space-y-1">
              <span className="font-bold text-white block">3. Allow Push Notifications</span>
              <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                Make sure notifications are set to <strong>Allowed</strong> with sound/vibration turned on.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 space-y-1">
              <span className="font-bold text-white block">4. Do Not Disturb Exception</span>
              <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                If you use DND mode at night, add Salah Companion to allowed exceptions for Fajr wake-up alarms.
              </p>
            </div>
          </div>

          {/* Test Push Verification Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
            <div>
              <span className="font-bold text-white block">Verify Everything Works on Your Device</span>
              <span className="text-[11px] text-amber-200/80">
                Trigger a test notification to confirm sound, vibration, and actionable buttons.
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleEnableReminders}
                className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                Enable Push
              </button>
              <button
                onClick={handleSendTestNotification}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs transition-all active:scale-95 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Notification</span>
              </button>
            </div>
          </div>

          {testStatus && (
            <div className="p-3 rounded-xl bg-emerald-800/40 border border-emerald-700 text-xs text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-2xl w-full mx-auto text-center py-4">
        <Link
          href="/"
          className="text-xs text-emerald-300/70 hover:text-white transition-colors"
        >
          ← Return to Salah Companion Dashboard
        </Link>
      </div>
    </div>
  );
}
