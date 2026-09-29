'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { UserProfile, MainPrayerName } from '@/lib/types';
import { CALCULATION_METHODS } from '@/lib/prayer-times';
import { subscribeToPush, sendInstantTestNotification } from '@/lib/web-push';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onRefreshLocation: () => void;
  isLocating: boolean;
  ramadanMode: boolean;
  onToggleRamadanMode: (val: boolean) => void;
  onOpenOnboarding?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onRefreshLocation,
  isLocating,
  ramadanMode,
  onToggleRamadanMode,
  onOpenOnboarding,
}) => {
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Custom Supabase & VAPID local state for convenience
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

  const handleAdjustmentChange = (prayer: MainPrayerName, delta: number) => {
    const currentAdj = profile.adjustments || { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    const newAdj = { ...currentAdj, [prayer]: Math.max(-30, Math.min(30, (currentAdj[prayer] || 0) + delta)) };
    onUpdateProfile({ ...profile, adjustments: newAdj });
  };

  const handlePrayerToggle = (prayer: MainPrayerName) => {
    const cur = profile.reminder_settings[prayer];
    const updated = {
      ...profile.reminder_settings,
      [prayer]: { ...cur, enabled: !cur.enabled },
    };
    onUpdateProfile({ ...profile, reminder_settings: updated });
  };

  const handleOffsetChange = (prayer: MainPrayerName, offset: number) => {
    const cur = profile.reminder_settings[prayer];
    const updated = {
      ...profile.reminder_settings,
      [prayer]: { ...cur, offset },
    };
    onUpdateProfile({ ...profile, reminder_settings: updated });
  };

  const handleNudgeChange = (prayer: MainPrayerName, nudge: number) => {
    const cur = profile.reminder_settings[prayer];
    const updated = {
      ...profile.reminder_settings,
      [prayer]: { ...cur, nudge },
    };
    onUpdateProfile({ ...profile, reminder_settings: updated });
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

  // Immediate 1-Minute Notification Test
  const handleTestNotification = async () => {
    setTestStatus('Sending test notification...');
    const ok = await sendInstantTestNotification();
    if (ok) {
      setTestStatus('✓ Notification sent! Check your notification banner/lock screen.');
      setTimeout(() => setTestStatus(null), 5000);
    } else {
      setTestStatus('Please click "Enable Push Reminders" first to grant permission.');
    }
  };

  const mainPrayers: { key: MainPrayerName; title: string }[] = [
    { key: 'fajr', title: 'Fajr' },
    { key: 'dhuhr', title: 'Dhuhr' },
    { key: 'asr', title: 'Asr' },
    { key: 'maghrib', title: 'Maghrib' },
    { key: 'isha', title: 'Isha' },
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 1: PUSH NOTIFICATIONS & REMINDERS */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/90 to-teal-950/80 border border-amber-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Bell className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">Prayer Reminders & Push</h3>
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

            {/* 1-Minute Test Trigger Button */}
            <button
              onClick={handleTestNotification}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
              title="Test notification immediately"
            >
              <Send className="w-3 h-3" />
              <span>Test (1-min)</span>
            </button>
          </div>
        </div>

        {testStatus && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{testStatus}</span>
          </div>
        )}

        {/* Per-Prayer Reminder Configuration Table */}
        <div className="space-y-3">
          {mainPrayers.map(({ key, title }) => {
            const setting = profile.reminder_settings[key] || {
              enabled: true,
              offset: 0,
              nudge: 15,
            };

            return (
              <div
                key={key}
                className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center justify-between md:justify-start gap-3">
                  <button
                    onClick={() => handlePrayerToggle(key)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      setting.enabled
                        ? 'bg-amber-500 text-emerald-950'
                        : 'bg-emerald-900 border border-emerald-700 text-emerald-500'
                    }`}
                  >
                    {setting.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <span className="font-semibold text-white text-sm">{title}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Pre-prayer alarm offset */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-300/70 text-[11px]">Alarm:</span>
                    <select
                      value={setting.offset}
                      disabled={!setting.enabled}
                      onChange={(e) => handleOffsetChange(key, Number(e.target.value))}
                      className="px-2 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700 text-xs text-white focus:outline-none disabled:opacity-50"
                    >
                      <option value={0}>At Prayer Time</option>
                      <option value={5}>5 min before</option>
                      <option value={10}>10 min before</option>
                      <option value={15}>15 min before</option>
                      <option value={30}>30 min before</option>
                    </select>
                  </div>

                  {/* Follow-up nudge */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-300/70 text-[11px]">Follow-up Nudge:</span>
                    <select
                      value={setting.nudge}
                      disabled={!setting.enabled}
                      onChange={(e) => handleNudgeChange(key, Number(e.target.value))}
                      className="px-2 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700 text-xs text-white focus:outline-none disabled:opacity-50"
                    >
                      <option value={0}>Disabled</option>
                      <option value={15}>15 min after if unprayed</option>
                      <option value={30}>30 min after if unprayed</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fajr Wake-up & Daily Ayah Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-white block">Fajr Wake-up Alarm</span>
              <span className="text-[11px] text-emerald-300/70">
                Gentle wake-up call 20m before Fajr
              </span>
            </div>
            <input
              type="checkbox"
              checked={profile.reminder_settings.fajr_wakeup}
              onChange={(e) =>
                onUpdateProfile({
                  ...profile,
                  reminder_settings: {
                    ...profile.reminder_settings,
                    fajr_wakeup: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-white block">Daily Ayah of the Day</span>
              <span className="text-[11px] text-emerald-300/70">
                Morning spiritual verse notification
              </span>
            </div>
            <input
              type="checkbox"
              checked={profile.reminder_settings.ayah_of_day}
              onChange={(e) =>
                onUpdateProfile({
                  ...profile,
                  reminder_settings: {
                    ...profile.reminder_settings,
                    ayah_of_day: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CALCULATION METHODS & ASR */}
      <div className="p-6 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-emerald-800/40">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-bold text-white">Calculation & Juristic Methods</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-emerald-200 mb-1.5">
              Prayer Times Calculation Authority
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
          </div>

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
                Hanafi (Later Asr)
              </button>
            </div>
          </div>
        </div>

        {/* Per-Prayer Minute Adjustments */}
        <div className="pt-3">
          <label className="block font-semibold text-emerald-200 text-xs mb-2">
            Per-Prayer Minute Fine-Tuning (-30 to +30 min)
          </label>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {mainPrayers.map(({ key, title }) => {
              const val = profile.adjustments?.[key] || 0;
              return (
                <div key={key} className="p-2.5 rounded-xl bg-emerald-900/30 border border-emerald-800/40">
                  <span className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {title}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleAdjustmentChange(key, -1)}
                      className="w-5 h-5 rounded bg-emerald-800 text-emerald-200 hover:bg-emerald-700"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-amber-300 w-6">
                      {val > 0 ? `+${val}` : val}
                    </span>
                    <button
                      onClick={() => handleAdjustmentChange(key, 1)}
                      className="w-5 h-5 rounded bg-emerald-800 text-emerald-200 hover:bg-emerald-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: LOCATION SETTINGS */}
      <div className="p-6 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Location & Coordinates</h3>
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
      </div>

      {/* SECTION 4: RAMADAN MODE TOGGLE */}
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

      {/* SECTION 5: SUPABASE & VAPID CLOUD CONFIGURATION */}
      <div className="p-6 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Supabase & VAPID Cloud Settings</h3>
          </div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold animate-fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <p className="text-xs text-emerald-200/70">
          Configure your Supabase project URL and VAPID keys to activate cross-device cloud sync and pg_cron automated push notifications.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
              className="w-full p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              VAPID Public Key (Web Push)
            </label>
            <input
              type="text"
              value={vapidPublicKey}
              onChange={(e) => setVapidPublicKey(e.target.value)}
              placeholder="BEl62iUYgUivxIkv69yViEuiBIa..."
              className="w-full p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveApiKeys}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-colors"
            >
              Save Cloud Keys
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 6: APP TOUR & ONBOARDING */}
      {onOpenOnboarding && (
        <div className="p-5 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">App Setup & Onboarding Guide</h4>
            <p className="text-xs text-emerald-300/70 mt-0.5">
              Review location permissions, push notifications setup, and iOS Home Screen installation instructions.
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
    </div>
  );
};
