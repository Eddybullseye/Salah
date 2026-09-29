'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Home,
  CheckSquare,
  BookOpen,
  Settings as SettingsIcon,
  Compass,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { HeroPrayerCard } from '@/components/HeroPrayerCard';
import { PrayerTimesList } from '@/components/PrayerTimesList';
import { PrayerTrackerView } from '@/components/PrayerTrackerView';
import { LearnIslamicContentView } from '@/components/LearnIslamicContentView';
import { SettingsView } from '@/components/SettingsView';
import { QiblaCompass } from '@/components/QiblaCompass';
import { TasbihCounter } from '@/components/TasbihCounter';
import { AuthModal } from '@/components/AuthModal';
import { RamadanCard } from '@/components/RamadanCard';
import { OnboardingModal } from '@/components/OnboardingModal';
import {
  calculatePrayerTimes,
  DEFAULT_PROFILE,
} from '@/lib/prayer-times';
import {
  calculateStreakStats,
  loadBookmarks,
  loadPrayerLogs,
  loadProfile,
  loadReadStories,
  logPrayerStatus,
  saveProfile,
  toggleBookmark,
  toggleStoryRead,
} from '@/lib/storage';
import { INITIAL_DAILY_CONTENT, INITIAL_DUAS, INITIAL_STORIES } from '@/lib/seed-data';
import {
  IslamicStory,
  MainPrayerName,
  PrayerLog,
  PrayerStatus,
  UserProfile,
} from '@/lib/types';
import { registerServiceWorker } from '@/lib/web-push';
import { getSupabase } from '@/lib/supabase';

export default function SalahCompanionApp() {
  const [activeTab, setActiveTab] = useState<'home' | 'tracker' | 'learn' | 'settings'>('home');
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [logs, setLogs] = useState<PrayerLog[]>(() => loadPrayerLogs());
  const [stories, setStories] = useState<IslamicStory[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCustomStories = localStorage.getItem('salah_custom_stories');
      if (savedCustomStories) {
        try {
          const parsed = JSON.parse(savedCustomStories);
          return [...parsed, ...INITIAL_STORIES];
        } catch {}
      }
    }
    return INITIAL_STORIES;
  });
  const [bookmarks, setBookmarks] = useState<string[]>(() => loadBookmarks());
  const [readStories, setReadStories] = useState<string[]>(() => loadReadStories());
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isLocating, setIsLocating] = useState(false);
  const [ramadanMode, setRamadanMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('salah_ramadan_mode') === 'true';
    }
    return false;
  });

  // Modals
  const [isCompassOpen, setIsCompassOpen] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('salah_onboarding_completed') !== 'true';
    }
    return false;
  });

  // Today's date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Prayer logging handler
  const handleLogPrayer = useCallback(
    async (
      prayer: MainPrayerName,
      status: PrayerStatus,
      targetDate: string = todayStr
    ) => {
      const updated = await logPrayerStatus(
        targetDate,
        prayer,
        status,
        currentUser?.id || 'guest'
      );
      setLogs(updated);
    },
    [currentUser?.id, todayStr]
  );

  // Geolocation detection
  const detectLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        let detectedCity = 'Current Location';
        let detectedCountry = '';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            detectedCity =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              data.address?.state ||
              'Current Location';
            detectedCountry = data.address?.country || '';
          }
        } catch {
          // Ignore network failure
        }

        setProfile((prev) => {
          const updated: UserProfile = {
            ...prev,
            latitude: lat,
            longitude: lng,
            city_name: detectedCity,
            country_name: detectedCountry,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          };
          saveProfile(updated);
          return updated;
        });

        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Initialize client state, service worker, and online events
  useEffect(() => {
    registerServiceWorker();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser(data.user);
          supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle()
            .then(({ data: remoteProf }) => {
              if (remoteProf) {
                setProfile((prev) => {
                  const updated = { ...prev, ...remoteProf };
                  saveProfile(updated);
                  return updated;
                });
              }
            });

          supabase
            .from('prayer_logs')
            .select('*')
            .eq('user_id', data.user.id)
            .then(({ data: remoteLogs }) => {
              if (remoteLogs && remoteLogs.length > 0) {
                setLogs(remoteLogs as PrayerLog[]);
                localStorage.setItem('salah_prayer_logs', JSON.stringify(remoteLogs));
              }
            });
        }
      });
    }

    const locationTimer = setTimeout(() => {
      if (profile.city_name === 'Makkah' && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        detectLocation();
      }
    }, 500);

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SALAH_ACTION_PRAYED') {
        const prayer = event.data.prayer as MainPrayerName;
        const date = event.data.date || new Date().toISOString().split('T')[0];
        if (prayer) {
          handleLogPrayer(prayer, 'on_time', date);
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      clearTimeout(locationTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [detectLocation, handleLogPrayer, profile.city_name]);

  // Today's prayer statuses map
  const todayLoggedStatuses = useMemo(() => {
    const map: Record<string, PrayerStatus> = {};
    logs
      .filter((l) => l.date === todayStr)
      .forEach((l) => {
        map[l.prayer] = l.status;
      });
    return map;
  }, [logs, todayStr]);

  // Prayer times calculated offline via adhan library
  const { prayers, currentPrayer, nextPrayer } = useMemo(() => {
    return calculatePrayerTimes(new Date(), profile, todayLoggedStatuses);
  }, [profile, todayLoggedStatuses]);

  // Streak & consistency statistics
  const streakStats = useMemo(() => {
    return calculateStreakStats(logs);
  }, [logs]);

  // Profile update handler
  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveProfile(updated);
  };

  // Bookmarks toggle
  const handleToggleBookmark = (id: string) => {
    const updated = toggleBookmark(id);
    setBookmarks(updated);
  };

  // Read stories toggle
  const handleToggleReadStory = (id: string) => {
    const updated = toggleStoryRead(id);
    setReadStories(updated);
  };

  // Add custom story (Admin)
  const handleAddStory = (newStory: IslamicStory) => {
    const updated = [newStory, ...stories];
    setStories(updated);
    localStorage.setItem(
      'salah_custom_stories',
      JSON.stringify(updated.filter((s) => s.id.startsWith('story-') === false || !INITIAL_STORIES.find((i) => i.id === s.id)))
    );
  };

  // Ramadan mode toggle
  const handleToggleRamadanMode = (val: boolean) => {
    setRamadanMode(val);
    localStorage.setItem('salah_ramadan_mode', String(val));
  };

  const fajrPrayer = prayers.find((p) => p.name === 'fajr');
  const maghribPrayer = prayers.find((p) => p.name === 'maghrib');

  return (
    <div className="min-h-screen bg-emerald-950 islamic-pattern flex flex-col selection:bg-amber-500 selection:text-emerald-950 text-slate-100">
      {/* Top Header */}
      <Header
        cityName={profile.city_name}
        countryName={profile.country_name}
        isOnline={isOnline}
        onOpenSettings={() => setActiveTab('settings')}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCompass={() => setIsCompassOpen(true)}
        onOpenTasbih={() => setIsTasbihOpen(true)}
        onRefreshLocation={detectLocation}
        isLocating={isLocating}
        userName={currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0]}
      />

      {/* PWA Install Banner (iOS Safari step-by-step + Chromium prompt) */}
      <PWAInstallBanner />

      {/* Main Responsive Body Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 pb-24 md:pb-8">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Ramadan Mode Card (if active) */}
            {ramadanMode && (
              <RamadanCard
                fajrTime={fajrPrayer ? fajrPrayer.dateObj : null}
                maghribTime={maghribPrayer ? maghribPrayer.dateObj : null}
                fajrStr={fajrPrayer ? fajrPrayer.timeStr : '04:30 AM'}
                maghribStr={maghribPrayer ? maghribPrayer.timeStr : '06:15 PM'}
              />
            )}

            {/* Responsive Tablet/Desktop Dual Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Hero Card & Prayers List */}
              <div className="lg:col-span-7 space-y-6">
                <HeroPrayerCard
                  currentPrayer={currentPrayer}
                  nextPrayer={nextPrayer}
                  onLogPrayer={handleLogPrayer}
                  onOpenReminderSettings={() => setActiveTab('settings')}
                  loggedStatuses={todayLoggedStatuses}
                />

                <PrayerTimesList
                  prayers={prayers}
                  onLogPrayer={handleLogPrayer}
                  onToggleReminder={(prayer) => {
                    const cur = profile.reminder_settings[prayer];
                    handleUpdateProfile({
                      ...profile,
                      reminder_settings: {
                        ...profile.reminder_settings,
                        [prayer]: { ...cur, enabled: !cur.enabled },
                      },
                    });
                  }}
                  reminderSettings={profile.reminder_settings}
                />
              </div>

              {/* Right Column: Quick Tracker & Featured Daily Content */}
              <div className="lg:col-span-5 space-y-5">
                {/* Quick Daily Streak Teaser */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/90 to-teal-950/80 border border-emerald-800/60 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/30">
                      🔥
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Prayer Consistency</h4>
                      <p className="text-xs text-emerald-200/70">
                        {streakStats.currentStreak} day streak • {streakStats.completionRate7Days}% this week
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('tracker')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 text-xs font-semibold border border-emerald-700/50 transition-colors"
                  >
                    View Tracker →
                  </button>
                </div>

                {/* Featured Daily Ayah / Hadith Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/80 to-teal-950/80 border border-amber-500/30 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Verse of the Day
                    </span>
                    <button
                      onClick={() => setActiveTab('learn')}
                      className="text-xs text-emerald-300 hover:text-white"
                    >
                      More →
                    </button>
                  </div>
                  <p className="text-base font-serif text-amber-200 text-right leading-loose">
                    {INITIAL_DAILY_CONTENT[0].arabic}
                  </p>
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    &ldquo;{INITIAL_DAILY_CONTENT[0].translation}&rdquo;
                  </p>
                  <p className="text-[11px] text-amber-300/80 font-medium">
                    {INITIAL_DAILY_CONTENT[0].source}
                  </p>
                </div>

                {/* Featured Story Teaser */}
                <div className="p-5 rounded-3xl bg-emerald-950/70 border border-emerald-800/60 shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
                      Prophet Story
                    </span>
                    <span className="text-[11px] text-amber-400 font-semibold">5 min read</span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {INITIAL_STORIES[0].title}
                  </h4>
                  <p className="text-xs text-emerald-200/70 line-clamp-2">
                    {INITIAL_STORIES[0].summary}
                  </p>
                  <button
                    onClick={() => setActiveTab('learn')}
                    className="w-full mt-2 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white text-xs font-semibold text-center transition-colors"
                  >
                    Read Full Story
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRACKER */}
        {activeTab === 'tracker' && (
          <div className="animate-fade-in">
            <PrayerTrackerView
              logs={logs}
              stats={streakStats}
              onLogPrayer={handleLogPrayer}
            />
          </div>
        )}

        {/* TAB 3: LEARN & STORIES */}
        {activeTab === 'learn' && (
          <div className="animate-fade-in">
            <LearnIslamicContentView
              stories={stories}
              duas={INITIAL_DUAS}
              dailyContent={INITIAL_DAILY_CONTENT}
              bookmarks={bookmarks}
              readStories={readStories}
              onToggleBookmark={handleToggleBookmark}
              onToggleReadStory={handleToggleReadStory}
              onAddStory={handleAddStory}
              isAdmin={profile.is_admin || true}
            />
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <SettingsView
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onRefreshLocation={detectLocation}
              isLocating={isLocating}
              ramadanMode={ramadanMode}
              onToggleRamadanMode={handleToggleRamadanMode}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Floating Offline Notification */}
      {!isOnline && (
        <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40 animate-bounce">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode — Prayer times are calculated locally.</span>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-800/50 px-2 py-2 shadow-2xl transition-colors md:hidden">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'home'
                ? 'text-amber-400 font-bold bg-emerald-900/60'
                : 'text-emerald-400/70 hover:text-emerald-200'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'tracker'
                ? 'text-amber-400 font-bold bg-emerald-900/60'
                : 'text-emerald-400/70 hover:text-emerald-200'
            }`}
          >
            <CheckSquare className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'learn'
                ? 'text-amber-400 font-bold bg-emerald-900/60'
                : 'text-emerald-400/70 hover:text-emerald-200'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Learn</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-amber-400 font-bold bg-emerald-900/60'
                : 'text-emerald-400/70 hover:text-emerald-200'
            }`}
          >
            <SettingsIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Settings</span>
          </button>
        </div>
      </nav>

      {/* Qibla Compass Modal */}
      <QiblaCompass
        isOpen={isCompassOpen}
        onClose={() => setIsCompassOpen(false)}
        latitude={profile.latitude}
        longitude={profile.longitude}
        cityName={profile.city_name}
      />

      {/* Digital Tasbih Modal */}
      <TasbihCounter
        isOpen={isTasbihOpen}
        onClose={() => setIsTasbihOpen(false)}
      />

      {/* Supabase Auth & Account Sync Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onUserChanged={(u) => setCurrentUser(u)}
      />

      {/* Onboarding Flow Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          if (typeof window !== 'undefined') {
            localStorage.setItem('salah_onboarding_completed', 'true');
          }
        }}
        onRequestLocation={detectLocation}
        userId={currentUser?.id}
        cityName={profile.city_name}
      />
    </div>
  );
}
