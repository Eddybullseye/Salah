'use client';

import React, { useState } from 'react';
import { Check, Clock, Bell, BellOff, MoreHorizontal, ChevronRight, Volume2 } from 'lucide-react';
import { PrayerTimeDisplay, PrayerStatus, MainPrayerName, ReminderSettings } from '@/lib/types';

interface PrayerTimesListProps {
  prayers: PrayerTimeDisplay[];
  onLogPrayer: (prayer: MainPrayerName, status: PrayerStatus) => void;
  onToggleReminder?: (prayer: MainPrayerName) => void;
  reminderSettings?: ReminderSettings | Record<string, { enabled: boolean }>;
  onPlayAdhan?: (prayer: MainPrayerName) => void;
}

export const PrayerTimesList: React.FC<PrayerTimesListProps> = ({
  prayers,
  onLogPrayer,
  onToggleReminder,
  reminderSettings,
  onPlayAdhan,
}) => {
  const [activeMenuPrayer, setActiveMenuPrayer] = useState<string | null>(null);

  const getStatusBadge = (status?: PrayerStatus | null) => {
    switch (status) {
      case 'on_time':
        return (
          <span suppressHydrationWarning className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Check className="w-3 h-3" />
            On Time
          </span>
        );
      case 'late':
        return (
          <span suppressHydrationWarning className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Late
          </span>
        );
      case 'qada':
        return (
          <span suppressHydrationWarning className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Qada
          </span>
        );
      case 'missed':
        return (
          <span suppressHydrationWarning className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Missed
          </span>
        );
      default:
        return (
          <span suppressHydrationWarning className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-300/80 hover:bg-emerald-800/60 border border-emerald-700/40 transition-colors">
            Tap to Log
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg divide-y divide-emerald-800/30 overflow-hidden">
      <div className="px-5 py-3.5 bg-emerald-900/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
          <span>Today&apos;s Prayers</span>
          <span className="text-xs font-normal text-emerald-300/70">• مواقيت الصلاة</span>
        </h3>
        <span className="text-xs text-amber-400/90 font-medium">Daily Schedule</span>
      </div>

      <div className="divide-y divide-emerald-800/30">
        {prayers.map((prayer) => {
          const isReminderEnabled =
            prayer.isMainPrayer && (reminderSettings as any)?.[prayer.name]?.enabled !== false;
          const isMenuOpen = activeMenuPrayer === prayer.name;

          return (
            <div
              key={prayer.name}
              suppressHydrationWarning
              className={`relative px-4 sm:px-5 py-3.5 flex items-center justify-between transition-colors ${
                prayer.isNext
                  ? 'bg-amber-500/10 border-l-4 border-l-amber-500'
                  : prayer.isCurrent
                  ? 'bg-emerald-800/30 border-l-4 border-l-emerald-500'
                  : 'hover:bg-emerald-900/20'
              }`}
            >
              {/* Prayer Name & Arabic */}
              <div className="flex items-center gap-3">
                <div
                  suppressHydrationWarning
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium ${
                    prayer.isNext
                      ? 'bg-amber-500 text-emerald-950 font-bold'
                      : prayer.isCurrent
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-emerald-900/60 text-emerald-200'
                  }`}
                >
                  {prayer.name === 'sunrise' ? '☀️' : prayer.displayName.charAt(0)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm sm:text-base font-semibold text-white" suppressHydrationWarning>
                      {prayer.displayName}
                    </span>
                    <span className="text-xs font-serif text-emerald-300/70" suppressHydrationWarning>
                      {prayer.arabicName}
                    </span>
                    {prayer.isNext && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-300 uppercase tracking-wider" suppressHydrationWarning>
                        Next
                      </span>
                    )}
                    {prayer.overrideType === 'csv' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Mosque
                      </span>
                    )}
                    {prayer.overrideType === 'fixed' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Fixed
                      </span>
                    )}
                    {prayer.overrideType === 'offset' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Offset
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-white font-mono font-bold" suppressHydrationWarning>{prayer.timeStr}</p>
                    {prayer.calculatedTimeStr && prayer.calculatedTimeStr !== prayer.timeStr && (
                      <span className="text-[10px] text-emerald-400/60 font-mono" suppressHydrationWarning>
                        (calc: {prayer.calculatedTimeStr})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2">
                {/* Play Adhan button (main prayers only) */}
                {prayer.isMainPrayer && onPlayAdhan && (
                  <button
                    onClick={() => onPlayAdhan(prayer.name as MainPrayerName)}
                    className="p-1.5 rounded-lg text-emerald-400/80 hover:text-amber-300 hover:bg-emerald-900/60 transition-colors"
                    title={`Play ${prayer.displayName} Adhan`}
                    aria-label={`Play ${prayer.displayName} Adhan`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}

                {/* Per-prayer reminder toggle (main prayers only) */}
                {prayer.isMainPrayer && onToggleReminder && (
                  <button
                    onClick={() => onToggleReminder(prayer.name as MainPrayerName)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isReminderEnabled
                        ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
                        : 'text-emerald-600 hover:text-emerald-400'
                    }`}
                    title={isReminderEnabled ? 'Reminder Active' : 'Reminder Muted'}
                    aria-label={`Toggle reminder for ${prayer.displayName}`}
                  >
                    {isReminderEnabled ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4 opacity-50" />
                    )}
                  </button>
                )}

                {/* Status logger trigger */}
                {prayer.isMainPrayer && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuPrayer(isMenuOpen ? null : prayer.name)
                      }
                      className="transition-transform active:scale-95"
                      suppressHydrationWarning
                    >
                      {getStatusBadge(prayer.status)}
                    </button>

                    {/* Popover Menu for status options */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 z-30 w-44 rounded-xl bg-emerald-950 border border-amber-500/40 shadow-2xl p-1.5 space-y-1 animate-fade-in">
                        <p className="text-[10px] uppercase font-bold text-amber-400 px-2 py-1">
                          Mark {prayer.displayName}
                        </p>
                        {(
                          [
                            { key: 'on_time', label: 'On Time', icon: '✓', color: 'text-emerald-400' },
                            { key: 'late', label: 'Late', icon: '⏳', color: 'text-amber-400' },
                            { key: 'qada', label: 'Made Up (Qada)', icon: '🔄', color: 'text-teal-400' },
                            { key: 'missed', label: 'Missed', icon: '✕', color: 'text-rose-400' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              onLogPrayer(prayer.name as MainPrayerName, opt.key);
                              setActiveMenuPrayer(null);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                              prayer.status === opt.key
                                ? 'bg-amber-500 text-emerald-950 font-bold'
                                : 'hover:bg-emerald-900/60 text-slate-200'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span className={opt.color}>{opt.icon}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
