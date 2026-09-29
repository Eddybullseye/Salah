'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, ChevronRight, Bell, Sparkles } from 'lucide-react';
import { PrayerTimeDisplay, PrayerStatus, MainPrayerName } from '@/lib/types';
import { formatCountdown } from '@/lib/prayer-times';

interface HeroPrayerCardProps {
  currentPrayer: PrayerTimeDisplay | null;
  nextPrayer: PrayerTimeDisplay | null;
  onLogPrayer: (prayer: MainPrayerName, status: PrayerStatus) => void;
  onOpenReminderSettings: () => void;
  loggedStatuses: Record<string, PrayerStatus>;
}

export const HeroPrayerCard: React.FC<HeroPrayerCardProps> = ({
  currentPrayer,
  nextPrayer,
  onLogPrayer,
  onOpenReminderSettings,
  loggedStatuses,
}) => {
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Active target for countdown is the next prayer
  const targetTime = nextPrayer ? nextPrayer.dateObj : null;

  useEffect(() => {
    if (!targetTime) return;

    const updateTimer = () => {
      const { formatted } = formatCountdown(targetTime);
      setCountdown(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const prayerToLog: MainPrayerName =
    currentPrayer?.isMainPrayer
      ? (currentPrayer.name as MainPrayerName)
      : nextPrayer?.isMainPrayer
      ? (nextPrayer.name as MainPrayerName)
      : 'fajr';

  const currentLoggedStatus = loggedStatuses[prayerToLog] || null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/90 via-teal-950 to-emerald-950 p-5 sm:p-7 border border-amber-500/30 shadow-xl shadow-emerald-950/60 text-white">
      {/* Decorative Islamic Geometric subtle background watermark */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-700/50 text-xs font-medium text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {currentPrayer
                ? `Current: ${currentPrayer.displayName} (${currentPrayer.timeStr})`
                : 'Night Interval'}
            </span>
          </div>

          <button
            onClick={onOpenReminderSettings}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Reminders</span>
          </button>
        </div>

        {/* Central Display: Next Prayer & Countdown */}
        {nextPrayer ? (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                Next Prayer
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {nextPrayer.displayName}
                </h2>
                <span className="text-2xl font-serif text-amber-300/80">
                  {nextPrayer.arabicName}
                </span>
                <span className="text-lg font-medium text-emerald-200/80">
                  at {nextPrayer.timeStr}
                </span>
              </div>
            </div>

            {/* Countdown Clock */}
            <div className="flex flex-col sm:items-end">
              <span className="text-[11px] font-medium text-emerald-300/70 uppercase tracking-wider">
                Time Remaining
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-3xl sm:text-4xl font-mono font-bold text-amber-300 tracking-wider">
                  {countdown}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold">All prayers completed today</h2>
            <p className="text-xs text-emerald-200/80 mt-1">May Allah accept your worship 🤍</p>
          </div>
        )}

        {/* Quick Prayer Action Bar */}
        <div className="pt-2 border-t border-emerald-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-emerald-200/80 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Prayer:{' '}
              <strong className="text-white capitalize font-semibold">{prayerToLog}</strong>
              {currentLoggedStatus && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-300 font-medium">
                  • Status:{' '}
                  <span className="capitalize text-amber-300">
                    {currentLoggedStatus.replace('_', ' ')}
                  </span>
                </span>
              )}
            </span>
          </div>

          <div className="relative">
            {!showStatusPicker ? (
              <button
                onClick={() => setShowStatusPicker(true)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 ${
                  currentLoggedStatus
                    ? 'bg-emerald-800/90 text-emerald-200 hover:bg-emerald-700/90 border border-emerald-600/50'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 shadow-amber-500/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentLoggedStatus ? 'Update Status' : 'Mark as Prayed'}</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-emerald-950 border border-amber-500/40 shadow-xl animate-fade-in">
                {(['on_time', 'late', 'qada', 'missed'] as PrayerStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onLogPrayer(prayerToLog, st);
                      setShowStatusPicker(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      currentLoggedStatus === st
                        ? 'bg-amber-500 text-emerald-950 font-bold'
                        : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
                <button
                  onClick={() => setShowStatusPicker(false)}
                  className="px-2 py-1 text-xs text-emerald-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
