'use client';

import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Volume2, VolumeX, Sparkles, ChevronRight, Check } from 'lucide-react';
import { loadProfile, loadTasbihState, saveTasbihState, TasbihState } from '@/lib/storage';
import { adhanAudio } from '@/lib/audio-player';

interface TasbihCounterProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    title: 'SubhanAllah',
    arabic: 'سُبْحَانَ اللَّهِ',
    translation: 'Glory be to Allah',
    target: 33,
  },
  {
    title: 'Alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    translation: 'All praise is due to Allah',
    target: 33,
  },
  {
    title: 'Allahu Akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    translation: 'Allah is the Greatest',
    target: 34,
  },
  {
    title: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    translation: 'I seek forgiveness from Allah',
    target: 100,
  },
  {
    title: 'La ilaha illallah',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    translation: 'There is no deity except Allah',
    target: 100,
  },
];

export const TasbihCounter: React.FC<TasbihCounterProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState<TasbihState>(() => loadTasbihState());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const prof = loadProfile();
    return prof.sound_settings?.tasbih_sound !== false;
  });

  if (!isOpen) return null;

  const currentPreset = PRESETS[state.presetIndex] || PRESETS[0];

  const handleTap = () => {
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {}
    }

    // Acoustic wooden bead sound
    if (soundEnabled) {
      adhanAudio.playTasbihClick(0.5);
    }

    const nextCount = state.count + 1;
    let nextCycles = state.totalCycles;

    if (state.target > 0 && nextCount >= state.target) {
      // Long vibration on completion
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([60, 50, 60]);
        } catch {}
      }

      // Uplifting completion chime
      if (soundEnabled) {
        adhanAudio.playCompletionTone(0.7);
      }

      nextCycles += 1;
      const newState: TasbihState = {
        ...state,
        count: 0,
        totalCycles: nextCycles,
      };
      setState(newState);
      saveTasbihState(newState);
    } else {
      const newState: TasbihState = {
        ...state,
        count: nextCount,
      };
      setState(newState);
      saveTasbihState(newState);
    }
  };

  const handleReset = () => {
    const newState: TasbihState = {
      ...state,
      count: 0,
    };
    setState(newState);
    saveTasbihState(newState);
  };

  const setPreset = (index: number) => {
    const p = PRESETS[index];
    const newState: TasbihState = {
      ...state,
      presetIndex: index,
      target: p.target,
      count: 0,
    };
    setState(newState);
    saveTasbihState(newState);
  };

  const progressPercent = state.target > 0 ? (state.count / state.target) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-emerald-950 via-teal-950 to-emerald-950 border border-amber-500/40 p-6 shadow-2xl text-white text-center flex flex-col items-center">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="absolute top-4 left-4 p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 transition-colors"
          title={soundEnabled ? 'Mute Bead Sound' : 'Enable Bead Sound'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-emerald-500" />}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold">Digital Tasbih</h3>
        </div>

        {/* Presets Horizontal Selector */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 my-2 no-scrollbar">
          {PRESETS.map((p, idx) => (
            <button
              key={p.title}
              onClick={() => setPreset(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                state.presetIndex === idx
                  ? 'bg-amber-500 text-emerald-950 font-bold'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Active Phrase Card */}
        <div className="my-2 p-3 w-full rounded-2xl bg-emerald-900/40 border border-emerald-800/60">
          <p className="text-2xl font-serif text-amber-200 tracking-wide">
            {currentPreset.arabic}
          </p>
          <p className="text-xs text-emerald-200/80 mt-1 italic">
            &ldquo;{currentPreset.translation}&rdquo;
          </p>
        </div>

        {/* Big Tap Target Bead Button */}
        <div className="my-4 relative">
          {/* Progress Ring */}
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="84"
              className="text-emerald-900/70"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="96"
              cy="96"
              r="84"
              className="text-amber-400 transition-all duration-150"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 84}
              strokeDashoffset={2 * Math.PI * 84 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Central Button */}
          <button
            onClick={handleTap}
            className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-800 via-teal-900 to-emerald-900 hover:from-emerald-700 hover:to-teal-800 border-2 border-amber-500/40 shadow-inner flex flex-col items-center justify-center active:scale-95 transition-transform select-none cursor-pointer"
          >
            <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
              {state.count}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mt-1">
              of {state.target}
            </span>
            <span className="text-[10px] text-emerald-300/60 mt-1">Tap anywhere</span>
          </button>
        </div>

        {/* Bottom Stats & Reset */}
        <div className="w-full flex items-center justify-between text-xs px-2 pt-3 border-t border-emerald-900/60 text-emerald-200">
          <div>
            <span>Completed Cycles: </span>
            <strong className="text-amber-400">{state.totalCycles}</strong>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Count</span>
          </button>
        </div>
      </div>
    </div>
  );
};
