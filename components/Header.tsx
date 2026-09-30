'use client';

import React from 'react';
import { Compass, Moon, Bell, Wifi, WifiOff, MapPin, Sparkles, User, RefreshCw } from 'lucide-react';
import { getHijriDate } from '@/lib/prayer-times';

interface HeaderProps {
  cityName: string;
  countryName: string;
  isOnline: boolean;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenCompass: () => void;
  onOpenTasbih: () => void;
  onRefreshLocation: () => void;
  isLocating: boolean;
  userName?: string | null;
}

import { useMounted } from '@/hooks/use-mounted';

export const Header: React.FC<HeaderProps> = ({
  cityName,
  countryName,
  isOnline,
  onOpenSettings,
  onOpenAuth,
  onOpenCompass,
  onOpenTasbih,
  onRefreshLocation,
  isLocating,
  userName,
}) => {
  const hijri = getHijriDate();
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-30 bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800/40 px-4 py-3 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and App Title */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 p-0.5 shadow-md shadow-emerald-950/50 flex items-center justify-center border border-amber-500/40">
            <span className="text-xl">🌙</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5" suppressHydrationWarning>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                Salah <span className="text-amber-400 font-serif font-normal">Companion</span>
              </h1>
              {mounted && !isOnline && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <WifiOff className="w-2.5 h-2.5" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-200/70 font-medium" suppressHydrationWarning>
              {hijri.formatted} <span className="opacity-60">•</span> <span className="font-serif">{hijri.formattedArabic}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions & Location */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Location button */}
          <button
            onClick={onRefreshLocation}
            disabled={isLocating}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-emerald-900/60 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/50 transition-colors"
            title="Refresh GPS Location"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[100px] truncate" suppressHydrationWarning>{cityName || 'Makkah'}</span>
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
          </button>

          {/* Qibla Compass Button */}
          <button
            onClick={onOpenCompass}
            className="p-2 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/60 text-amber-300 border border-emerald-700/40 transition-transform active:scale-95"
            title="Qibla Compass"
            aria-label="Qibla Compass"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Tasbih Counter Button */}
          <button
            onClick={onOpenTasbih}
            className="p-2 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/40 transition-transform active:scale-95"
            title="Digital Tasbih Counter"
            aria-label="Digital Tasbih Counter"
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
          </button>

          {/* User Profile / Auth Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-medium transition-all"
            title="Account & Sync"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline max-w-[90px] truncate" suppressHydrationWarning>{userName || 'Account'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
