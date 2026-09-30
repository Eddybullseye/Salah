'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Sunrise, Sunset, Clock, Sparkles } from 'lucide-react';
import { formatCountdown } from '@/lib/prayer-times';

interface RamadanCardProps {
  fajrTime: Date | null;
  maghribTime: Date | null;
  fajrStr: string;
  maghribStr: string;
}

export const RamadanCard: React.FC<RamadanCardProps> = ({
  fajrTime,
  maghribTime,
  fajrStr,
  maghribStr,
}) => {
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [isFasting, setIsFasting] = useState<boolean>(false);

  useEffect(() => {
    if (!fajrTime || !maghribTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const fajrMs = fajrTime.getTime();
      const maghribMs = maghribTime.getTime();

      // Check if currently between Fajr and Maghrib
      if (now >= fajrMs && now < maghribMs) {
        setIsFasting(true);
        const { formatted } = formatCountdown(maghribTime);
        setCountdown(formatted);
      } else {
        setIsFasting(false);
        // Target is next Suhoor (Fajr)
        const target = now < fajrMs ? fajrTime : new Date(fajrMs + 24 * 3600 * 1000);
        const { formatted } = formatCountdown(target);
        setCountdown(formatted);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [fajrTime, maghribTime]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 border border-amber-500/40 p-5 shadow-xl text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Moon className="w-4 h-4" />
          </span>
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
            Ramadan Mode Active
          </span>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isFasting
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {isFasting ? 'Fasting Window' : 'Suhoor Prep'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Iftar / Suhoor Countdown */}
        <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-800/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-200/70 font-medium block">
              {isFasting ? 'Countdown to Iftar (Maghrib)' : 'Countdown to Suhoor Ends (Fajr)'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-mono font-bold text-amber-300" suppressHydrationWarning>{countdown}</span>
            </div>
          </div>
          <span className="text-3xl">{isFasting ? '🌅' : '🌙'}</span>
        </div>

        {/* Times Breakdown */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/30 flex flex-col justify-center">
            <span className="text-[10px] text-emerald-300/70 uppercase font-semibold flex items-center gap-1">
              <Sunrise className="w-3 h-3 text-amber-400" /> Suhoor Stop
            </span>
            <span className="text-sm font-bold text-white mt-0.5" suppressHydrationWarning>{fajrStr}</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/30 flex flex-col justify-center">
            <span className="text-[10px] text-emerald-300/70 uppercase font-semibold flex items-center gap-1">
              <Sunset className="w-3 h-3 text-amber-400" /> Iftar (Fast Break)
            </span>
            <span className="text-sm font-bold text-white mt-0.5" suppressHydrationWarning>{maghribStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
