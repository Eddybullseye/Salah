'use client';

import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Square,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';
import { MainPrayerName, PrayerStatus } from '@/lib/types';
import { adhanAudio, AudioPlaybackState } from '@/lib/audio-player';

interface AdhanPlayingModalProps {
  isOpen: boolean;
  prayer: MainPrayerName;
  arabicName?: string;
  onClose: () => void;
  onMarkPrayed: (prayer: MainPrayerName) => void;
  onSnooze: (prayer: MainPrayerName, minutes: number) => void;
  completionToneEnabled?: boolean;
}

export const AdhanPlayingModal: React.FC<AdhanPlayingModalProps> = ({
  isOpen,
  prayer,
  arabicName,
  onClose,
  onMarkPrayed,
  onSnooze,
  completionToneEnabled = true,
}) => {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(() => adhanAudio.getState());

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = adhanAudio.subscribe((state) => {
      setPlaybackState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const prayerCapitalized = prayer.charAt(0).toUpperCase() + prayer.slice(1);
  const isFajr = prayer === 'fajr';

  const handleStop = () => {
    adhanAudio.stop();
    onClose();
  };

  const handleSnooze = () => {
    adhanAudio.stop();
    onSnooze(prayer, 10);
    onClose();
  };

  const handlePrayed = () => {
    adhanAudio.stop();
    if (completionToneEnabled) {
      adhanAudio.playCompletionTone();
    }
    onMarkPrayed(prayer);
    onClose();
  };

  const handleTogglePlayPause = () => {
    if (playbackState.isPlaying) {
      adhanAudio.pause();
    } else {
      adhanAudio.resume();
    }
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/95 backdrop-blur-xl animate-fade-in text-white select-none">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-emerald-900/90 via-teal-950/90 to-emerald-950 border border-amber-500/40 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Top Status Header */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Adhan is Playing</span>
        </div>

        {/* Central Crescent & Soundwave Visualizer */}
        <div className="relative my-2">
          {/* Pulsing ring outer */}
          <div className="w-32 h-32 rounded-full bg-emerald-800/40 border border-amber-500/30 flex items-center justify-center relative shadow-2xl">
            {playbackState.isPlaying && (
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-ping opacity-30" />
            )}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/30 to-teal-800/50 flex items-center justify-center border border-amber-400/50 text-4xl shadow-inner">
              🌙
            </div>
          </div>
        </div>

        {/* Prayer Name & Muezzin */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {prayerCapitalized}
            </h2>
            {arabicName && (
              <span className="text-2xl font-serif text-amber-300">
                {arabicName}
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-300/80">
            {playbackState.voiceName || 'Holy Adhan'}
            {playbackState.muezzin && ` • ${playbackState.muezzin}`}
          </p>
          {isFajr && (
            <p className="text-[11px] font-serif text-amber-300/90 italic pt-1">
              &ldquo;As-salatu khayrun minan-nawm&rdquo; (Prayer is better than sleep)
            </p>
          )}
        </div>

        {/* Audio Progress / Duration */}
        <div className="w-full max-w-xs space-y-2">
          <div className="w-full bg-emerald-900/60 rounded-full h-1.5 overflow-hidden border border-emerald-800">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{
                width: playbackState.duration > 0
                  ? `${Math.min(100, (playbackState.currentTime / playbackState.duration) * 100)}%`
                  : '30%',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-300/70 font-mono">
            <span>{formatSecs(playbackState.currentTime)}</span>
            <button
              onClick={handleTogglePlayPause}
              className="p-1 rounded-full text-amber-300 hover:text-white"
              title={playbackState.isPlaying ? 'Pause' : 'Play'}
            >
              {playbackState.isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
            <span>{formatSecs(playbackState.duration || 180)}</span>
          </div>
        </div>

        {/* Action Controls: Stop, Snooze 10m, and I Prayed */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* 1. Stop Button */}
          <button
            onClick={handleStop}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-semibold transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Adhan</span>
          </button>

          {/* 2. Snooze 10m Button */}
          <button
            onClick={handleSnooze}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700/60 text-xs font-semibold transition-all active:scale-95"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Snooze 10m</span>
          </button>

          {/* 3. I Prayed Button */}
          <button
            onClick={handlePrayed}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Prayed ✓</span>
          </button>
        </div>

        {/* Helpful Footnote */}
        <p className="text-[11px] text-emerald-400/60">
          Media controls active on Lock Screen & Bluetooth devices
        </p>
      </div>
    </div>
  );
};
