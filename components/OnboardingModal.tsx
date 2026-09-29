'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { isIOS, isStandalone, subscribeToPush } from '@/lib/web-push';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
  userId?: string;
  cityName?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onRequestLocation,
  userId,
  cityName,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'enabling' | 'granted' | 'denied'>('idle');
  const [locationGranted, setLocationGranted] = useState(false);

  const [isIOSDevice] = useState(() => (typeof window !== 'undefined' ? isIOS() : false));
  const [isAppInstalled] = useState(() => (typeof window !== 'undefined' ? isStandalone() : false));

  if (!isOpen) return null;

  const handleEnableLocation = () => {
    onRequestLocation();
    setLocationGranted(true);
    setTimeout(() => {
      setCurrentStep(1);
    }, 800);
  };

  const handleEnableNotifications = async () => {
    setNotificationStatus('enabling');
    const res = await subscribeToPush(undefined, userId, 'My Device');
    if (res.success) {
      setNotificationStatus('granted');
      setTimeout(() => {
        // If already installed or not on iOS, complete or go to step 2
        setCurrentStep(2);
      }, 1000);
    } else {
      setNotificationStatus('denied');
    }
  };

  const steps = [
    {
      id: 'location',
      title: 'Accurate Local Prayer Times',
      subtitle: 'Calculated completely offline right on your device',
    },
    {
      id: 'notifications',
      title: 'Never Miss a Prayer',
      subtitle: 'Timely reminders, Fajr wake-up alarms, and gentle nudges',
    },
    {
      id: 'install',
      title: isIOSDevice ? 'Add to iPhone Home Screen' : 'Install Salah Companion',
      subtitle: isIOSDevice
        ? 'iOS 16.4+ requires Home Screen installation for lock-screen Web Push'
        : 'Fast offline access and native app experience',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-emerald-950 via-teal-950 to-emerald-950 border border-amber-500/40 p-6 sm:p-7 shadow-2xl text-white flex flex-col justify-between min-h-[500px]">
        {/* Top Progress & Skip */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-7 bg-amber-400'
                      : idx < currentStep
                      ? 'w-3 bg-emerald-500'
                      : 'w-3 bg-emerald-900'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="text-xs text-emerald-300/80 hover:text-white font-medium transition-colors"
            >
              Skip
            </button>
          </div>

          {/* STEP 0: LOCATION */}
          {currentStep === 0 && (
            <div className="mt-6 text-center space-y-4 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-800/40 border border-amber-500/40 flex items-center justify-center shadow-inner">
                <MapPin className="w-8 h-8 text-amber-400" />
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {steps[0].title}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-1 max-w-xs mx-auto leading-relaxed">
                  Salah Companion computes Fajr, Dhuhr, Asr, Maghrib, and Isha based on the position of the sun at your exact coordinates.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-800/50 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-100 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Private & Works Offline</span>
                </div>
                <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                  Your coordinates stay private on your device. Prayer times are calculated with the mathematical <code className="text-amber-300">adhan</code> engine even with zero internet connectivity.
                </p>
                {cityName && cityName !== 'Makkah' && (
                  <div className="pt-1 text-[11px] text-amber-300 font-medium">
                    Current location: <strong>{cityName}</strong>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleEnableLocation}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{locationGranted ? 'Location Detected ✓' : 'Detect My Location'}</span>
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full mt-2 text-center text-xs text-emerald-300/70 hover:text-emerald-100 py-1"
                >
                  Keep default (Makkah) & enter city later
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: NOTIFICATIONS */}
          {currentStep === 1 && (
            <div className="mt-6 text-center space-y-4 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-800/40 border border-amber-500/40 flex items-center justify-center shadow-inner">
                <Bell className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {steps[1].title}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-1 max-w-xs mx-auto leading-relaxed">
                  Receive gentle reminders when it is time to pray, right when the adhan begins.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50">
                  <span className="text-amber-400 font-bold block mb-0.5">🌅 Fajr Wake-up</span>
                  <span className="text-[11px] text-emerald-300/70">
                    Optional alarm 20m before dawn
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50">
                  <span className="text-teal-300 font-bold block mb-0.5">🤍 Gentle Nudges</span>
                  <span className="text-[11px] text-emerald-300/70">
                    Helpful check-in if you get caught up in work
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 text-left text-xs text-emerald-200/80 space-y-1">
                <p className="font-semibold text-white">Actionable Notifications:</p>
                <p className="text-[11px] text-emerald-300/70">
                  Notifications include quick actions: tap <strong>&ldquo;✓ I prayed&rdquo;</strong> to log without opening the app, or <strong>&ldquo;⏰ Remind in 10m&rdquo;</strong> to snooze.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleEnableNotifications}
                  disabled={notificationStatus === 'enabling'}
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    notificationStatus === 'granted'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 shadow-amber-500/20'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>
                    {notificationStatus === 'enabling'
                      ? 'Requesting...'
                      : notificationStatus === 'granted'
                      ? 'Notifications Enabled ✓'
                      : 'Enable Prayer Reminders'}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full mt-2 text-center text-xs text-emerald-300/70 hover:text-emerald-100 py-1"
                >
                  Continue without push
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PWA INSTALLATION (ESPECIALLY FOR iOS 16.4+) */}
          {currentStep === 2 && (
            <div className="mt-6 text-center space-y-4 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-800/40 border border-amber-500/40 flex items-center justify-center shadow-inner">
                <Smartphone className="w-8 h-8 text-amber-400" />
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {steps[2].title}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-1 max-w-xs mx-auto leading-relaxed">
                  {isIOSDevice
                    ? 'Apple requires PWAs to be installed on your Home Screen (iOS 16.4+) to deliver push notifications when locked.'
                    : 'Install to your home screen for quick daily tracking, full-screen display, and offline use.'}
                </p>
              </div>

              {isIOSDevice ? (
                <div className="space-y-2.5 text-left text-xs">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50">
                    <div className="w-6 h-6 rounded-lg bg-emerald-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        Tap the Share button <Share className="w-3.5 h-3.5 text-amber-400 inline" />
                      </p>
                      <p className="text-[11px] text-emerald-300/70">
                        At the bottom of Safari on iPhone (or top bar on iPad).
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
                        Scroll down the menu list and tap &quot;Add to Home Screen&quot;.
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
                        Open Salah Companion from your home screen for full push notification support!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-800/50 text-left space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-100 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Instant Launch & Offline Sync</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                    Install Salah Companion to your device launcher or home screen. It will open instantly with zero browser address bar distractions.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                >
                  Start Using Salah Companion 🤍
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Back Button */}
        {currentStep > 0 && (
          <div className="pt-4 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-300">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-[11px] text-emerald-400/60">
              Step {currentStep + 1} of 3
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
