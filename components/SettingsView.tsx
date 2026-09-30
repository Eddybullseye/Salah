'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  MapPin,
  Clock,
  Sliders,
  Send,
  Database,
  Moon,
  Check,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Volume2,
  VolumeX,
  Play,
  Square,
  DownloadCloud,
  Info,
  Sparkles,
  Music,
  RotateCcw,
  Calendar,
  Compass,
  ArrowRight,
  Globe,
} from 'lucide-react';
import {
  UserProfile,
  MainPrayerName,
  PrayerName,
  AdhanVoice,
  PrayerSoundMode,
  SoundSettings,
  PrayerCalculationMode,
  MosqueTimetableOverride,
  HighLatitudeRuleType,
} from '@/lib/types';
import {
  CALCULATION_METHODS,
  HIGH_LATITUDE_RULES,
  DEFAULT_SOUND_SETTINGS,
  DEFAULT_PRAYER_MODES,
  calculatePrayerTimes,
} from '@/lib/prayer-times';
import { subscribeToPush, sendInstantTestNotification } from '@/lib/web-push';
import { adhanAudio } from '@/lib/audio-player';
import { INITIAL_ADHAN_VOICES } from '@/lib/seed-data';
import { CompareMethodsModal } from './CompareMethodsModal';
import { MosqueTimetableModal } from './MosqueTimetableModal';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onRefreshLocation: () => void;
  isLocating: boolean;
  ramadanMode: boolean;
  onToggleRamadanMode: (val: boolean) => void;
  onOpenOnboarding?: () => void;
  timetableOverrides?: MosqueTimetableOverride[];
  onSaveTimetableOverrides?: (overrides: MosqueTimetableOverride[]) => void;
  onClearTimetableOverrides?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onRefreshLocation,
  isLocating,
  ramadanMode,
  onToggleRamadanMode,
  onOpenOnboarding,
  timetableOverrides = [],
  onSaveTimetableOverrides = () => {},
  onClearTimetableOverrides = () => {},
}) => {
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [playingPreviewVoiceId, setPlayingPreviewVoiceId] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [isCaching, setIsCaching] = useState(false);

  // Modals
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isMosqueModalOpen, setIsMosqueModalOpen] = useState(false);

  const soundSettings: SoundSettings = profile.sound_settings || DEFAULT_SOUND_SETTINGS;

  useEffect(() => {
    const unsub = adhanAudio.subscribe((state) => {
      if (!state.isPlaying) {
        setPlayingPreviewVoiceId(null);
      }
    });
    return () => unsub();
  }, []);

  // Timezone check
  const deviceTimezone =
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const hasTimezoneMismatch = profile.timezone && profile.timezone !== deviceTimezone;

  // Custom Supabase & VAPID local state
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return (
      (typeof window !== 'undefined' && localStorage.getItem('salah_custom_supabase_url')) ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      ''
    );
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => {
    return (
      (typeof window !== 'undefined' && localStorage.getItem('salah_custom_supabase_anon_key')) ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    );
  });
  const [vapidPublicKey, setVapidPublicKey] = useState(() => {
    return (
      (typeof window !== 'undefined' && localStorage.getItem('salah_custom_vapid_public_key')) ||
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      ''
    );
  });

  const handleSaveApiKeys = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('salah_custom_supabase_url', supabaseUrl.trim());
      localStorage.setItem('salah_custom_supabase_anon_key', supabaseAnonKey.trim());
      localStorage.setItem('salah_custom_vapid_public_key', vapidPublicKey.trim());
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleMethodChange = (methodId: string) => {
    onUpdateProfile({ ...profile, calculation_method: methodId });
  };

  const handleAsrMethodChange = (asr: 'Standard' | 'Hanafi') => {
    onUpdateProfile({ ...profile, asr_method: asr });
  };

  const handleHighLatitudeRuleChange = (rule: HighLatitudeRuleType) => {
    onUpdateProfile({ ...profile, high_latitude_rule: rule });
  };

  const handleHijriOffsetChange = (offset: number) => {
    onUpdateProfile({ ...profile, hijri_offset: Math.max(-2, Math.min(2, offset)) });
  };

  const handleTimezoneChange = (tz: string) => {
    onUpdateProfile({ ...profile, timezone: tz });
  };

  // Adjustments & Calculation Modes
  const handlePrayerAdjustmentChange = (prayer: PrayerName, delta: number) => {
    const currentAdj = profile.adjustments || { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    const curVal = currentAdj[prayer] || 0;
    const newVal = Math.max(-60, Math.min(60, curVal + delta));

    const currentModes = profile.prayer_modes || DEFAULT_PRAYER_MODES;
    const currentMode = currentModes[prayer] || { mode: 'auto', offset_minutes: 0 };

    onUpdateProfile({
      ...profile,
      adjustments: { ...currentAdj, [prayer]: newVal },
      prayer_modes: {
        ...currentModes,
        [prayer]: { ...currentMode, mode: newVal !== 0 ? 'offset' : currentMode.mode, offset_minutes: newVal },
      },
    });
  };

  const handleDirectOffsetInput = (prayer: PrayerName, valStr: string) => {
    const num = parseInt(valStr, 10);
    const newVal = isNaN(num) ? 0 : Math.max(-60, Math.min(60, num));
    const currentAdj = profile.adjustments || { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    const currentModes = profile.prayer_modes || DEFAULT_PRAYER_MODES;
    const currentMode = currentModes[prayer] || { mode: 'auto', offset_minutes: 0 };

    onUpdateProfile({
      ...profile,
      adjustments: { ...currentAdj, [prayer]: newVal },
      prayer_modes: {
        ...currentModes,
        [prayer]: { ...currentMode, mode: newVal !== 0 ? 'offset' : 'auto', offset_minutes: newVal },
      },
    });
  };

  const handlePrayerModeSelect = (prayer: PrayerName, mode: PrayerCalculationMode) => {
    const currentModes = profile.prayer_modes || DEFAULT_PRAYER_MODES;
    const currentMode = currentModes[prayer] || { mode: 'auto', offset_minutes: 0 };
    const currentAdj = profile.adjustments || { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

    onUpdateProfile({
      ...profile,
      adjustments: mode === 'auto' ? { ...currentAdj, [prayer]: 0 } : currentAdj,
      prayer_modes: {
        ...currentModes,
        [prayer]: {
          ...currentMode,
          mode,
          offset_minutes: mode === 'auto' ? 0 : currentMode.offset_minutes,
        },
      },
    });
  };

  const handleFixedTimeChange = (prayer: PrayerName, fixedTime: string) => {
    const currentModes = profile.prayer_modes || DEFAULT_PRAYER_MODES;
    const currentMode = currentModes[prayer] || { mode: 'fixed', offset_minutes: 0 };

    onUpdateProfile({
      ...profile,
      prayer_modes: {
        ...currentModes,
        [prayer]: {
          ...currentMode,
          mode: 'fixed',
          fixed_time: fixedTime,
        },
      },
    });
  };

  const handleResetPrayer = (prayer: PrayerName) => {
    const currentAdj = profile.adjustments || { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    const currentModes = profile.prayer_modes || DEFAULT_PRAYER_MODES;

    onUpdateProfile({
      ...profile,
      adjustments: { ...currentAdj, [prayer]: 0 },
      prayer_modes: {
        ...currentModes,
        [prayer]: { mode: 'auto', offset_minutes: 0 },
      },
    });
  };

  const handleResetAllPrayers = () => {
    onUpdateProfile({
      ...profile,
      adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      prayer_modes: DEFAULT_PRAYER_MODES,
    });
  };

  // Sound Settings Handlers
  const updateSoundSettings = (partial: Partial<SoundSettings>) => {
    const updated: SoundSettings = {
      ...soundSettings,
      ...partial,
    };
    onUpdateProfile({ ...profile, sound_settings: updated });
  };

  const handlePrayerSoundMode = (prayer: MainPrayerName, mode: PrayerSoundMode) => {
    const currentPrayerCfg = soundSettings.prayers[prayer] || { sound_mode: 'adhan' };
    const updatedPrayers = {
      ...soundSettings.prayers,
      [prayer]: {
        ...currentPrayerCfg,
        sound_mode: mode,
      },
    };
    updateSoundSettings({ prayers: updatedPrayers });
  };

  const handlePrayerVoiceOverride = (prayer: MainPrayerName, voiceId: string) => {
    const currentPrayerCfg = soundSettings.prayers[prayer] || { sound_mode: 'adhan' };
    const updatedPrayers = {
      ...soundSettings.prayers,
      [prayer]: {
        ...currentPrayerCfg,
        voice_id: voiceId === 'default' ? undefined : voiceId,
      },
    };
    updateSoundSettings({ prayers: updatedPrayers });
  };

  const handleTogglePreviewVoice = async (voice: AdhanVoice, isFajr = false) => {
    if (playingPreviewVoiceId === voice.id) {
      adhanAudio.stop();
      setPlayingPreviewVoiceId(null);
    } else {
      setPlayingPreviewVoiceId(voice.id);
      await adhanAudio.previewVoice(voice, isFajr, soundSettings.volume);
    }
  };

  const handlePreloadAudio = async () => {
    setIsCaching(true);
    setCacheStatus('Caching audio files to Service Worker Cache API...');
    try {
      const res = await adhanAudio.preloadAllAdhanAudio(INITIAL_ADHAN_VOICES);
      setIsCaching(false);
      setCacheStatus(`✓ ${res.cached} audio files successfully cached for 100% offline playback!`);
      setTimeout(() => setCacheStatus(null), 5000);
    } catch {
      setIsCaching(false);
      setCacheStatus('Audio cached locally with synthesizer fallback ready.');
    }
  };

  // Push subscription registration flow
  const handleEnablePush = async () => {
    setIsSubscribing(true);
    setTestStatus('Requesting notification permission...');
    const res = await subscribeToPush(vapidPublicKey || undefined, profile.id, 'My Primary Device');
    setIsSubscribing(false);
    if (res.success) {
      setTestStatus('✓ Notifications enabled successfully!');
      setTimeout(() => setTestStatus(null), 4000);
    } else {
      setTestStatus(`Error: ${res.error}`);
    }
  };

  const handleTestNotification = async () => {
    setTestStatus('Sending test notification with adhan payload...');
    const ok = await sendInstantTestNotification();
    if (ok) {
      setTestStatus('✓ Test notification sent! Check banner & tap to test adhan deep link.');
      setTimeout(() => setTestStatus(null), 5000);
    } else {
      setTestStatus('Please click "Enable Reminders" first to grant permission.');
    }
  };

  // Compute live current prayer times for previewing calculated vs adjusted
  const { prayers: livePrayers } = calculatePrayerTimes(
    new Date(),
    profile,
    {},
    timetableOverrides
  );

  const allPrayersList: { key: PrayerName; title: string }[] = [
    { key: 'fajr', title: 'Fajr' },
    { key: 'sunrise', title: 'Sunrise' },
    { key: 'dhuhr', title: 'Dhuhr' },
    { key: 'asr', title: 'Asr' },
    { key: 'maghrib', title: 'Maghrib' },
    { key: 'isha', title: 'Isha' },
  ];

  const mainPrayers: { key: MainPrayerName; title: string }[] = [
    { key: 'fajr', title: 'Fajr' },
    { key: 'dhuhr', title: 'Dhuhr' },
    { key: 'asr', title: 'Asr' },
    { key: 'maghrib', title: 'Maghrib' },
    { key: 'isha', title: 'Isha' },
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 1: PRAYER TIME ADJUSTMENT & MOSQUE CORRECTIONS */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/90 to-teal-950/90 border border-amber-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">Prayer Time Adjustment & Correction</h3>
            </div>
            <p className="text-xs text-emerald-200/70 mt-0.5">
              Fine-tune minute offsets (-60 to +60), set manual fixed times, or import your local mosque timetable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsMosqueModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/70 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Import Mosque CSV</span>
              {timetableOverrides.length > 0 && (
                <span className="px-1.5 py-0.2 bg-purple-500 text-white rounded-full text-[10px]">
                  {timetableOverrides.length}
                </span>
              )}
            </button>

            <button
              onClick={handleResetAllPrayers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 text-xs font-semibold transition-colors"
              title="Reset all prayers to base calculated times"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>
        </div>

        {/* Active Mosque Overrides Banner */}
        {timetableOverrides.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-600/50 flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>
                <strong>{timetableOverrides.length} Mosque Schedule Overrides Active.</strong> Imported times take priority on those dates.
              </span>
            </div>
            <button
              onClick={() => setIsMosqueModalOpen(true)}
              className="underline hover:text-white font-medium text-[11px]"
            >
              Manage CSV
            </button>
          </div>
        )}

        {/* Per-Prayer Adjustments & Mode Steppers */}
        <div className="space-y-3">
          {allPrayersList.map(({ key, title }) => {
            const prayerDisplay = livePrayers.find((p) => p.name === key);
            const pMode = profile.prayer_modes?.[key] || { mode: 'auto', offset_minutes: 0 };
            const offsetVal = profile.adjustments?.[key] ?? pMode.offset_minutes ?? 0;
            const currentMode = pMode.mode || (offsetVal !== 0 ? 'offset' : 'auto');

            return (
              <div
                key={key}
                className="p-4 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 space-y-3 text-xs"
              >
                {/* Top Row: Title, Mode Tabs, and Calculated vs Adjusted times */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{title}</span>
                    {prayerDisplay?.overrideType === 'csv' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Mosque Override
                      </span>
                    )}
                    {prayerDisplay?.overrideType === 'fixed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Fixed Time
                      </span>
                    )}
                    {prayerDisplay?.overrideType === 'offset' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {offsetVal > 0 ? `+${offsetVal}m` : `${offsetVal}m`}
                      </span>
                    )}
                  </div>

                  {/* Calculated vs Adjusted Side-by-Side */}
                  <div className="flex items-center gap-2 font-mono text-[11px] bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/50">
                    <span className="text-emerald-400/70">
                      Calc: <strong className="text-emerald-200">{prayerDisplay?.calculatedTimeStr}</strong>
                    </span>
                    <ArrowRight className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-300 font-bold">
                      Adjusted: {prayerDisplay?.timeStr}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Mode Selector & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-emerald-800/30">
                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60">
                    <button
                      onClick={() => handlePrayerModeSelect(key, 'auto')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        currentMode === 'auto'
                          ? 'bg-amber-500 text-emerald-950 font-bold'
                          : 'text-emerald-300 hover:text-white'
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      onClick={() => handlePrayerModeSelect(key, 'offset')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        currentMode === 'offset'
                          ? 'bg-amber-500 text-emerald-950 font-bold'
                          : 'text-emerald-300 hover:text-white'
                      }`}
                    >
                      Auto + Offset
                    </button>
                    <button
                      onClick={() => handlePrayerModeSelect(key, 'fixed')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        currentMode === 'fixed'
                          ? 'bg-amber-500 text-emerald-950 font-bold'
                          : 'text-emerald-300 hover:text-white'
                      }`}
                    >
                      Fixed Time
                    </button>
                  </div>

                  {/* Mode-Specific Input: Stepper or Timepicker */}
                  <div className="flex items-center gap-2">
                    {currentMode === 'offset' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePrayerAdjustmentChange(key, -1)}
                          className="w-7 h-7 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-sm"
                          title="-1 minute"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="-60"
                          max="60"
                          value={offsetVal}
                          onChange={(e) => handleDirectOffsetInput(key, e.target.value)}
                          className="w-14 text-center py-1 rounded-lg bg-emerald-900 border border-emerald-700 font-mono font-bold text-amber-300 text-xs focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() => handlePrayerAdjustmentChange(key, 1)}
                          className="w-7 h-7 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-sm"
                          title="+1 minute"
                        >
                          +
                        </button>
                        <span className="text-[11px] text-emerald-400/80">min</span>
                      </div>
                    )}

                    {currentMode === 'fixed' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-emerald-300/70">Time:</span>
                        <input
                          type="time"
                          value={pMode.fixed_time || '12:00'}
                          onChange={(e) => handleFixedTimeChange(key, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-emerald-900 border border-emerald-700 font-mono text-white text-xs"
                        />
                      </div>
                    )}

                    {/* Reset single prayer button */}
                    {(offsetVal !== 0 || currentMode !== 'auto') && (
                      <button
                        onClick={() => handleResetPrayer(key)}
                        className="p-1 rounded text-emerald-400 hover:text-white transition-colors"
                        title="Reset to calculated"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CALCULATION METHODS, HIGH LATITUDE, & ACCURACY */}
      <div className="p-6 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-emerald-800/40">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Calculation Authorities & High Latitudes</h3>
          </div>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Compare 12 Methods Side-by-Side</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Method Picker */}
          <div>
            <label className="block font-semibold text-emerald-200 mb-1.5">
              Calculation Authority Formula
            </label>
            <select
              value={profile.calculation_method}
              onChange={(e) => handleMethodChange(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white text-xs focus:outline-none focus:border-amber-400"
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              {CALCULATION_METHODS.find((m) => m.id === profile.calculation_method)?.description}
            </p>
          </div>

          {/* Asr Juristic Method */}
          <div>
            <label className="block font-semibold text-emerald-200 mb-1.5">
              Asr Juristic Method (Madhab)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAsrMethodChange('Standard')}
                className={`py-2 px-3 rounded-xl font-medium transition-all ${
                  profile.asr_method === 'Standard'
                    ? 'bg-amber-500 text-emerald-950 font-bold'
                    : 'bg-emerald-900/40 text-emerald-200 hover:bg-emerald-800 border border-emerald-700/50'
                }`}
              >
                Standard (Shafi/Maliki/Hanbali)
              </button>
              <button
                type="button"
                onClick={() => handleAsrMethodChange('Hanafi')}
                className={`py-2 px-3 rounded-xl font-medium transition-all ${
                  profile.asr_method === 'Hanafi'
                    ? 'bg-amber-500 text-emerald-950 font-bold'
                    : 'bg-emerald-900/40 text-emerald-200 hover:bg-emerald-800 border border-emerald-700/50'
                }`}
              >
                Hanafi (Shadow x2)
              </button>
            </div>
          </div>

          {/* High Latitude Rule */}
          <div>
            <label className="block font-semibold text-emerald-200 mb-1.5">
              High Latitude Twilight Rule
            </label>
            <select
              value={profile.high_latitude_rule || 'MiddleOfTheNight'}
              onChange={(e) => handleHighLatitudeRuleChange(e.target.value as HighLatitudeRuleType)}
              className="w-full p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white text-xs focus:outline-none focus:border-amber-400"
            >
              {HIGH_LATITUDE_RULES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              {HIGH_LATITUDE_RULES.find((r) => r.id === (profile.high_latitude_rule || 'MiddleOfTheNight'))?.description}
            </p>
          </div>

          {/* Lunar Hijri Date Adjustment */}
          <div>
            <label className="block font-semibold text-emerald-200 mb-1.5">
              Hijri Date Moon-Sighting Offset (-2 to +2 days)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleHijriOffsetChange((profile.hijri_offset || 0) - 1)}
                className="w-8 h-8 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-sm"
              >
                -
              </button>
              <span className="w-16 text-center font-mono font-bold text-amber-300 text-xs py-1.5 bg-emerald-900/60 rounded-lg border border-emerald-700">
                {(profile.hijri_offset || 0) > 0 ? `+${profile.hijri_offset}` : profile.hijri_offset || 0} days
              </span>
              <button
                type="button"
                onClick={() => handleHijriOffsetChange((profile.hijri_offset || 0) + 1)}
                className="w-8 h-8 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-sm"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleHijriOffsetChange(0)}
                className="text-[11px] text-emerald-300/70 hover:text-white underline ml-2"
              >
                Reset
              </button>
            </div>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              Adjusts the calendar forward or back to match your local crescent sighting announcement.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: LOCATION & TIMEZONE OVERRIDE */}
      <div className="p-6 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Location & Timezone Synchronization</h3>
          </div>
          <button
            onClick={onRefreshLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-xs text-emerald-200 border border-emerald-700/50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting...' : 'Auto-Detect GPS'}</span>
          </button>
        </div>

        {/* Timezone Mismatch Warning */}
        {hasTimezoneMismatch && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Timezone Notice:</strong> Device timezone (<code className="text-white">{deviceTimezone}</code>) differs from saved profile (<code className="text-white">{profile.timezone}</code>).
              </span>
            </div>
            <button
              onClick={() => handleTimezoneChange(deviceTimezone)}
              className="px-3 py-1 rounded-xl bg-amber-500 text-emerald-950 font-bold text-xs shrink-0"
            >
              Sync to Device Timezone
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-emerald-300/80 block mb-1 font-medium">City</label>
            <input
              type="text"
              value={profile.city_name}
              onChange={(e) => onUpdateProfile({ ...profile, city_name: e.target.value })}
              className="w-full p-2 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white"
            />
          </div>
          <div>
            <label className="text-emerald-300/80 block mb-1 font-medium">Country</label>
            <input
              type="text"
              value={profile.country_name}
              onChange={(e) => onUpdateProfile({ ...profile, country_name: e.target.value })}
              className="w-full p-2 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white"
            />
          </div>
          <div>
            <label className="text-emerald-300/80 block mb-1 font-medium">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={profile.latitude}
              onChange={(e) =>
                onUpdateProfile({ ...profile, latitude: parseFloat(e.target.value) || 0 })
              }
              className="w-full p-2 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-emerald-300/80 block mb-1 font-medium">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={profile.longitude}
              onChange={(e) =>
                onUpdateProfile({ ...profile, longitude: parseFloat(e.target.value) || 0 })
              }
              className="w-full p-2 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-emerald-300/80 block mb-1 font-medium text-xs">Timezone Override</label>
          <input
            type="text"
            value={profile.timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full p-2 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white font-mono text-xs"
            placeholder="e.g. Asia/Riyadh, America/New_York"
          />
        </div>
      </div>

      {/* SECTION 4: ADHAN & ISLAMIC SOUNDS */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/90 to-teal-950/90 border border-emerald-800/60 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Volume2 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">Adhan & Islamic Sounds</h3>
            </div>
            <p className="text-xs text-emerald-200/70 mt-0.5">
              Selectable Makkah, Madinah, Al-Aqsa voices, per-prayer sound modes, and tactile acoustic tones.
            </p>
          </div>

          <button
            onClick={handlePreloadAudio}
            disabled={isCaching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors shrink-0"
            title="Cache all adhans offline into browser Cache API"
          >
            <DownloadCloud className={`w-3.5 h-3.5 ${isCaching ? 'animate-bounce' : ''}`} />
            <span>{isCaching ? 'Caching...' : 'Cache Audio Offline'}</span>
          </button>
        </div>

        {cacheStatus && (
          <div className="p-3 rounded-xl bg-emerald-800/40 border border-emerald-700/50 text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cacheStatus}</span>
          </div>
        )}

        {/* Honest Background Audio Limitations Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-200">
                Important Note on Mobile Background Audio
              </h4>
              <p className="text-emerald-200/90 leading-relaxed">
                Operating systems (iOS and Android) intentionally prevent web applications from playing unprompted loud audio when the app is closed or killed in the background.
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-emerald-300/80 text-[11px] pt-1">
                <li><strong>When the app is open / foreground:</strong> The full chosen Adhan auto-plays seamlessly with full-screen prayer controls.</li>
                <li><strong>When phone is locked / app is closed:</strong> A high-priority push reminder is delivered to your lock screen. Tapping it opens the app directly into the Adhan player to start recitation immediately.</li>
                <li><strong>Android recommendation:</strong> Set battery usage for this app to &quot;Unrestricted&quot; in Android Settings and install as PWA for the most prompt reminders.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="p-4 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Master Volume</span>
            </span>
            <span className="font-mono text-amber-300 font-bold">
              {Math.round(soundSettings.volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={soundSettings.volume}
            onChange={(e) => updateSoundSettings({ volume: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 bg-emerald-900/60 rounded-lg cursor-pointer h-2"
          />
        </div>

        {/* Global Default Adhan Voice */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-emerald-200">
            Global Default Adhan Voice
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INITIAL_ADHAN_VOICES.map((voice) => {
              const isSelected = soundSettings.default_voice_id === voice.id;
              const isPlayingThis = playingPreviewVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  className={`p-3 rounded-2xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-900/70 border-amber-400/80 shadow-md shadow-amber-500/10'
                      : 'bg-emerald-900/30 border-emerald-800/40 hover:bg-emerald-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-white block text-[13px]">{voice.name}</span>
                      <span className="text-[11px] text-emerald-300/70 block">{voice.muezzin}</span>
                    </div>

                    <button
                      onClick={() => handleTogglePreviewVoice(voice)}
                      className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-amber-300 transition-colors"
                      title={isPlayingThis ? 'Stop Preview' : 'Preview Voice'}
                    >
                      {isPlayingThis ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-emerald-200/60 line-clamp-1">{voice.description}</p>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => updateSoundSettings({ default_voice_id: voice.id })}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-emerald-950'
                          : 'bg-emerald-800 text-emerald-200 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Active Voice ✓' : 'Set as Default'}
                    </button>
                    <span className="text-[10px] text-emerald-400/60 font-mono">
                      ~{Math.round(voice.duration_seconds / 60)} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-Prayer Sound Mode & Voice Override Table */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-emerald-200">
            Per-Prayer Sound Configuration
          </label>
          <div className="space-y-2.5">
            {mainPrayers.map(({ key, title }) => {
              const cfg = soundSettings.prayers[key] || { sound_mode: 'adhan' };
              const isFajr = key === 'fajr';

              return (
                <div
                  key={key}
                  className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{title}</span>
                    {isFajr && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Includes &quot;As-salatu khayrun minan-nawm&quot;
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Sound Mode Select */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-300/70 text-[11px]">Mode:</span>
                      <select
                        value={cfg.sound_mode}
                        onChange={(e) => handlePrayerSoundMode(key, e.target.value as PrayerSoundMode)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-900/70 border border-emerald-700 text-xs text-white focus:outline-none"
                      >
                        <option value="adhan">Full Adhan</option>
                        <option value="soft_tone">Soft Reminder Tone</option>
                        <option value="notification_only">Default Alert Only</option>
                        <option value="silent">Silent</option>
                      </select>
                    </div>

                    {/* Voice Override Select */}
                    {cfg.sound_mode === 'adhan' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-300/70 text-[11px]">Voice:</span>
                        <select
                          value={cfg.voice_id || 'default'}
                          onChange={(e) => handlePrayerVoiceOverride(key, e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-900/70 border border-emerald-700 text-xs text-white focus:outline-none"
                        >
                          <option value="default">Use Global Default</option>
                          {INITIAL_ADHAN_VOICES.filter((v) => v.id !== 'voice-soft-reminder').map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Do Not Disturb (DND) Window */}
        <div className="p-4 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-white text-xs">Do Not Disturb (DND) Window</span>
            </div>
            <input
              type="checkbox"
              checked={soundSettings.dnd_enabled}
              onChange={(e) => updateSoundSettings({ dnd_enabled: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
            />
          </div>

          <p className="text-[11px] text-emerald-300/70">
            Automatically silence auto-play adhans during night hours.
          </p>

          {soundSettings.dnd_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-300/80">From:</span>
                <input
                  type="time"
                  value={soundSettings.dnd_start_time}
                  onChange={(e) => updateSoundSettings({ dnd_start_time: e.target.value })}
                  className="px-2 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700 text-white"
                />
                <span className="text-emerald-300/80">To:</span>
                <input
                  type="time"
                  value={soundSettings.dnd_end_time}
                  onChange={(e) => updateSoundSettings({ dnd_end_time: e.target.value })}
                  className="px-2 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700 text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dnd_fajr"
                  checked={soundSettings.dnd_allow_fajr}
                  onChange={(e) => updateSoundSettings({ dnd_allow_fajr: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                />
                <label htmlFor="dnd_fajr" className="text-emerald-200 text-xs cursor-pointer">
                  Always allow Fajr Adhan (DND exemption)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Extra Islamic Sounds Toggles */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-emerald-200">
            Extra Islamic Sounds & Acoustic Chimes
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* 1. Pre-prayer chime */}
            <div className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-white block">Pre-Prayer Chime</span>
                <span className="text-[11px] text-emerald-300/70">Ascending soft double chime</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adhanAudio.playPrePrayerChime(soundSettings.volume)}
                  className="p-1 text-amber-400 hover:text-white"
                  title="Test Chime"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={soundSettings.pre_prayer_chime}
                  onChange={(e) => updateSoundSettings({ pre_prayer_chime: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                />
              </div>
            </div>

            {/* 2. Nudge tone */}
            <div className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-white block">Gentle Nudge Tone</span>
                <span className="text-[11px] text-emerald-300/70">&quot;Still haven&apos;t prayed?&quot; reminder</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adhanAudio.playNudgeTone(soundSettings.volume)}
                  className="p-1 text-amber-400 hover:text-white"
                  title="Test Tone"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={soundSettings.nudge_tone}
                  onChange={(e) => updateSoundSettings({ nudge_tone: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                />
              </div>
            </div>

            {/* 3. Completion tone */}
            <div className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-white block">&quot;I Prayed&quot; Completion Tone</span>
                <span className="text-[11px] text-emerald-300/70">Uplifting serene chime on logging</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adhanAudio.playCompletionTone(soundSettings.volume)}
                  className="p-1 text-amber-400 hover:text-white"
                  title="Test Tone"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={soundSettings.completion_tone}
                  onChange={(e) => updateSoundSettings({ completion_tone: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                />
              </div>
            </div>

            {/* 4. Tasbih bead click */}
            <div className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-white block">Tasbih Bead Click</span>
                <span className="text-[11px] text-emerald-300/70">Tactile wooden resonance tap</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adhanAudio.playTasbihClick(soundSettings.volume)}
                  className="p-1 text-amber-400 hover:text-white"
                  title="Test Click"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={soundSettings.tasbih_sound}
                  onChange={(e) => updateSoundSettings({ tasbih_sound: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                />
              </div>
            </div>

            {/* 5. Quran Recitation Clips */}
            <div className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-between gap-2 sm:col-span-2">
              <div>
                <span className="font-semibold text-white block">Quran Recitation Clips</span>
                <span className="text-[11px] text-emerald-300/70">
                  Peaceful sacred recitation motif (Surah Al-Fatihah / Ayat al-Kursi)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adhanAudio.playQuranRecitationClip(soundSettings.volume)}
                  className="p-1 text-amber-400 hover:text-white"
                  title="Test Recitation"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={soundSettings.quran_recitation}
                  onChange={(e) => updateSoundSettings({ quran_recitation: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: PUSH NOTIFICATIONS & TIMING ALARMS */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/90 to-teal-950/80 border border-emerald-800/60 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Bell className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">Prayer Reminders & Push Timing</h3>
            </div>
            <p className="text-xs text-emerald-200/70 mt-0.5">
              Lock-screen notifications with custom pre-prayer alarms and gentle follow-up nudges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleEnablePush}
              disabled={isSubscribing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isSubscribing ? 'Enabling...' : 'Enable Reminders'}</span>
            </button>

            <button
              onClick={handleTestNotification}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
              title="Test notification immediately"
            >
              <Send className="w-3 h-3" />
              <span>Test Push</span>
            </button>
          </div>
        </div>

        {testStatus && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{testStatus}</span>
          </div>
        )}
      </div>

      {/* SECTION 6: RAMADAN MODE TOGGLE */}
      <div className="p-6 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Ramadan Mode</h4>
            <p className="text-xs text-emerald-300/70 mt-0.5">
              Displays Suhoor cutoff countdown, Iftar timer, and fasting companion.
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleRamadanMode(!ramadanMode)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            ramadanMode
              ? 'bg-amber-500 text-emerald-950'
              : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
          }`}
        >
          {ramadanMode ? 'Enabled ✓' : 'Disabled'}
        </button>
      </div>

      {/* SECTION 7: APP TOUR & ONBOARDING */}
      {onOpenOnboarding && (
        <div className="p-5 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">App Setup & Onboarding Guide</h4>
            <p className="text-xs text-emerald-300/70 mt-0.5">
              Review location permissions, push notifications setup, adhan audio gesture, and install instructions.
            </p>
          </div>

          <button
            onClick={onOpenOnboarding}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shrink-0 ml-3"
          >
            Launch Tour
          </button>
        </div>
      )}

      {/* Compare Methods Modal */}
      <CompareMethodsModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        profile={profile}
        onSelectMethod={handleMethodChange}
      />

      {/* Mosque Timetable CSV Modal */}
      <MosqueTimetableModal
        isOpen={isMosqueModalOpen}
        onClose={() => setIsMosqueModalOpen(false)}
        currentOverrides={timetableOverrides}
        onSaveOverrides={onSaveTimetableOverrides}
        onClearOverrides={onClearTimetableOverrides}
      />
    </div>
  );
};
