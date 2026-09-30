'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Play,
  Square,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  ChevronLeft,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { MainPrayerName, PrayerStatus } from '@/lib/types';
import { adhanAudio, AudioPlaybackState } from '@/lib/audio-player';
import { loadProfile, logPrayerStatus } from '@/lib/storage';

function AdhanPlayerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawPrayer = searchParams.get('prayer') || 'dhuhr';
  const soundMode = searchParams.get('sound') || 'adhan';

  const validPrayers: MainPrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayer: MainPrayerName = validPrayers.includes(rawPrayer as MainPrayerName)
    ? (rawPrayer as MainPrayerName)
    : 'dhuhr';

  const prayerNamesArabic: Record<MainPrayerName, string> = {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };

  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(() => adhanAudio.getState());
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasPrayedLogged, setHasPrayedLogged] = useState(false);
  const [snoozeMessage, setSnoozeMessage] = useState<string | null>(null);

  const prayerCapitalized = prayer.charAt(0).toUpperCase() + prayer.slice(1);
  const isFajr = prayer === 'fajr';

  useEffect(() => {
    const unsubscribe = adhanAudio.subscribe((state) => {
      setPlaybackState(state);
    });

    const attemptAutoplay = async () => {
      const profile = loadProfile();
      try {
        const res = await adhanAudio.playAdhan({
          prayer,
          soundSettings: profile.sound_settings,
          forcePlay: true,
        });

        if (!res.success && res.reason?.includes('blocked')) {
          setAutoplayBlocked(true);
        }
      } catch (err) {
        setAutoplayBlocked(true);
      }
    };

    attemptAutoplay();

    return () => {
      unsubscribe();
    };
  }, [prayer]);

  const handleManualPlay = async () => {
    await adhanAudio.unlockAudio();
    const profile = loadProfile();
    await adhanAudio.playAdhan({
      prayer,
      soundSettings: profile.sound_settings,
      forcePlay: true,
    });
    setAutoplayBlocked(false);
  };

  const handleStop = () => {
    adhanAudio.stop();
  };

  const handleSnooze = () => {
    adhanAudio.stop();
    setSnoozeMessage('Snoozed for 10 minutes. A gentle reminder will follow 🤍');
    setTimeout(() => {
      router.push('/?tab=home');
    }, 2000);
  };

  const handleMarkPrayed = async () => {
    adhanAudio.stop();
    const profile = loadProfile();
    if (profile.sound_settings?.completion_tone !== false) {
      adhanAudio.playCompletionTone();
    }
    const today = new Date().toISOString().split('T')[0];
    await logPrayerStatus(today, prayer, 'on_time', 'guest');
    setHasPrayedLogged(true);
    setTimeout(() => {
      router.push('/?tab=tracker');
    }, 2200);
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-emerald-950 islamic-pattern flex flex-col justify-between text-white p-4 sm:p-6">
      {/* Top Bar Navigation */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors p-2 rounded-lg bg-emerald-900/40 border border-emerald-800/40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <div className="text-right">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Salah Reminder
          </span>
        </div>
      </div>

      {/* Main Centered Adhan Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-3xl bg-gradient-to-b from-emerald-900/90 via-teal-950 to-emerald-950 border border-amber-500/40 p-6 sm:p-8 shadow-2xl text-center space-y-6">
          {/* Top Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Time for {prayerCapitalized} Prayer</span>
          </div>

          {/* Crescent & Play Status */}
          <div className="relative my-2 flex justify-center">
            <div className="w-28 h-28 rounded-full bg-emerald-800/40 border border-amber-500/30 flex items-center justify-center relative shadow-2xl">
              {playbackState.isPlaying && (
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-ping opacity-30" />
              )}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-teal-800/50 flex items-center justify-center border border-amber-400/50 text-3xl shadow-inner">
                🌙
              </div>
            </div>
          </div>

          {/* Prayer Titles */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {prayerCapitalized}
              </h1>
              <span className="text-2xl font-serif text-amber-300">
                {prayerNamesArabic[prayer]}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80">
              {playbackState.voiceName || 'Adhan Audio'}
              {playbackState.muezzin && ` • ${playbackState.muezzin}`}
            </p>
            {isFajr && (
              <p className="text-xs font-serif text-amber-300/90 italic pt-1">
                &ldquo;As-salatu khayrun minan-nawm&rdquo;
              </p>
            )}
          </div>

          {/* Autoplay blocked fallback: Large "Play Adhan" button */}
          {!playbackState.isPlaying && !hasPrayedLogged && (
            <div className="space-y-3 pt-2">
              <button
                onClick={handleManualPlay}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Play Adhan</span>
              </button>
              <p className="text-[11px] text-emerald-300/70">
                Mobile browsers require a tap to activate audio playback
              </p>
            </div>
          )}

          {/* Playing Progress Bar */}
          {playbackState.isPlaying && (
            <div className="w-full space-y-2 pt-2">
              <div className="w-full bg-emerald-900/60 rounded-full h-1.5 overflow-hidden border border-emerald-800">
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{
                    width:
                      playbackState.duration > 0
                        ? `${Math.min(100, (playbackState.currentTime / playbackState.duration) * 100)}%`
                        : '40%',
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-300/70 font-mono">
                <span>{formatSecs(playbackState.currentTime)}</span>
                <span>{formatSecs(playbackState.duration || 180)}</span>
              </div>
            </div>
          )}

          {/* Action Row */}
          {hasPrayedLogged ? (
            <div className="p-4 rounded-2xl bg-emerald-800/40 border border-emerald-700/60 text-center space-y-1 animate-fade-in">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">Prayer Logged as Completed ✓</p>
              <p className="text-xs text-emerald-200/80">May Allah accept your Salah!</p>
            </div>
          ) : snoozeMessage ? (
            <div className="p-4 rounded-2xl bg-teal-800/40 border border-teal-700/60 text-center space-y-1 animate-fade-in">
              <Clock className="w-7 h-7 text-amber-400 mx-auto" />
              <p className="text-xs text-emerald-100">{snoozeMessage}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={handleStop}
                className="py-3 px-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-semibold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </button>

              <button
                onClick={handleSnooze}
                className="py-3 px-2 rounded-xl bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700/60 text-xs font-semibold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Snooze 10m</span>
              </button>

              <button
                onClick={handleMarkPrayed}
                className="py-3 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-emerald-950 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Prayed ✓</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="max-w-md w-full mx-auto text-center pt-4">
        <Link
          href="/"
          className="text-xs text-emerald-300/80 hover:text-white inline-flex items-center gap-1 transition-colors"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function AdhanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-emerald-950 flex items-center justify-center text-white">
          <p className="text-sm text-emerald-300">Loading prayer reminder...</p>
        </div>
      }
    >
      <AdhanPlayerContent />
    </Suspense>
  );
}
