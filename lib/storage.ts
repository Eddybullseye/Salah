import { getSupabase } from './supabase';
import { MosqueTimetableOverride, PrayerLog, PrayerStatus, StreakStats, UserProfile } from './types';
import { DEFAULT_PROFILE } from './prayer-times';

const PROFILE_KEY = 'salah_user_profile';
const LOGS_KEY = 'salah_prayer_logs';
const BOOKMARKS_KEY = 'salah_user_bookmarks';
const READ_STORIES_KEY = 'salah_read_stories';
const TASBIH_KEY = 'salah_tasbih_data';
const TIMETABLE_OVERRIDES_KEY = 'salah_timetable_overrides';

// Load User Profile with safe defaults
export function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        adjustments: {
          ...DEFAULT_PROFILE.adjustments,
          ...(parsed.adjustments || {}),
        },
        prayer_modes: {
          ...DEFAULT_PROFILE.prayer_modes,
          ...(parsed.prayer_modes || {}),
        },
      };
    }
  } catch (e) {
    console.warn('Error reading profile from localStorage:', e);
  }
  return DEFAULT_PROFILE;
}

// Load Mosque Timetable Overrides (CSV / Mosque Imported)
export function loadTimetableOverrides(): MosqueTimetableOverride[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(TIMETABLE_OVERRIDES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading timetable overrides:', e);
  }
  return [];
}

// Save Mosque Timetable Overrides
export function saveTimetableOverrides(overrides: MosqueTimetableOverride[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TIMETABLE_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Error saving timetable overrides:', e);
  }
}

// Clear Mosque Timetable Overrides
export function clearTimetableOverrides(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TIMETABLE_OVERRIDES_KEY);
}

// Save User Profile
export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving profile to localStorage:', e);
  }
}

// Load Prayer Logs
export function loadPrayerLogs(): PrayerLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading logs from localStorage:', e);
  }
  return [];
}

// Save / Upsert a single prayer log
export async function logPrayerStatus(
  date: string,
  prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  status: PrayerStatus,
  userId = 'guest',
  notes = ''
): Promise<PrayerLog[]> {
  const currentLogs = loadPrayerLogs();
  const existingIdx = currentLogs.findIndex((l) => l.date === date && l.prayer === prayer);

  const updatedLog: PrayerLog = {
    id: existingIdx >= 0 ? currentLogs[existingIdx].id : `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    user_id: userId,
    date,
    prayer,
    status,
    notes,
    logged_at: new Date().toISOString(),
  };

  let newLogs: PrayerLog[];
  if (existingIdx >= 0) {
    newLogs = [...currentLogs];
    newLogs[existingIdx] = updatedLog;
  } else {
    newLogs = [updatedLog, ...currentLogs];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOGS_KEY, JSON.stringify(newLogs));
  }

  // If Supabase is active and user is authenticated, sync to prayer_logs table
  const supabase = getSupabase();
  if (supabase && userId && userId !== 'guest') {
    try {
      await supabase.from('prayer_logs').upsert(
        {
          user_id: userId,
          date,
          prayer,
          status,
          notes,
          logged_at: updatedLog.logged_at,
        },
        { onConflict: 'user_id,date,prayer' }
      );
    } catch (e) {
      console.warn('Could not sync prayer log to Supabase:', e);
    }
  }

  return newLogs;
}

// Calculate streaks and consistency metrics
export function calculateStreakStats(logs: PrayerLog[]): StreakStats {
  const mainPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  let totalPrayed = 0;
  let onTimeCount = 0;
  let lateCount = 0;
  let qadaCount = 0;
  let missedCount = 0;

  // Group by date
  const logsByDate = new Map<string, Map<string, PrayerStatus>>();
  for (const log of logs) {
    if (!logsByDate.has(log.date)) {
      logsByDate.set(log.date, new Map());
    }
    logsByDate.get(log.date)!.set(log.prayer, log.status);

    if (log.status === 'on_time') onTimeCount++;
    else if (log.status === 'late') lateCount++;
    else if (log.status === 'qada') qadaCount++;
    else if (log.status === 'missed') missedCount++;

    if (log.status === 'on_time' || log.status === 'late' || log.status === 'qada') {
      totalPrayed++;
    }
  }

  // Calculate streak: consecutive days with at least 5 prayers completed or 1+ prayer
  // Let's compute streak where at least 1 prayer (or all 5) was prayed
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  // Check backward up to 365 days
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMap = logsByDate.get(dateStr);

    let dayCompletedPrayers = 0;
    if (dayMap) {
      for (const p of mainPrayers) {
        const s = dayMap.get(p);
        if (s === 'on_time' || s === 'late' || s === 'qada') {
          dayCompletedPrayers++;
        }
      }
    }

    if (dayCompletedPrayers >= 1) {
      tempStreak++;
      if (i === 0 || (i === 1 && currentStreak === 0)) {
        currentStreak = tempStreak;
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      if (i === 0) {
        // Today might not be completed yet; continue checking yesterday
        continue;
      }
      tempStreak = 0;
    }
  }

  // Calculate 7-day and 30-day rates
  let count7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMap = logsByDate.get(dateStr);
    if (dayMap) {
      for (const p of mainPrayers) {
        const s = dayMap.get(p);
        if (s === 'on_time' || s === 'late' || s === 'qada') count7++;
      }
    }
  }
  const completionRate7Days = Math.min(100, Math.round((count7 / 35) * 100));

  let count30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMap = logsByDate.get(dateStr);
    if (dayMap) {
      for (const p of mainPrayers) {
        const s = dayMap.get(p);
        if (s === 'on_time' || s === 'late' || s === 'qada') count30++;
      }
    }
  }
  const completionRate30Days = Math.min(100, Math.round((count30 / 150) * 100));

  return {
    currentStreak: Math.max(currentStreak, tempStreak > 0 ? tempStreak : 0),
    bestStreak: Math.max(bestStreak, currentStreak),
    totalPrayed,
    onTimeCount,
    lateCount,
    qadaCount,
    missedCount,
    completionRate7Days,
    completionRate30Days,
  };
}

// Bookmarks helpers
export function loadBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(itemId: string): string[] {
  const current = loadBookmarks();
  const index = current.indexOf(itemId);
  let updated: string[];
  if (index >= 0) {
    updated = current.filter((id) => id !== itemId);
  } else {
    updated = [...current, itemId];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  }
  return updated;
}

// Read Stories helpers
export function loadReadStories(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(READ_STORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleStoryRead(storyId: string): string[] {
  const current = loadReadStories();
  const index = current.indexOf(storyId);
  let updated: string[];
  if (index >= 0) {
    updated = current.filter((id) => id !== storyId);
  } else {
    updated = [...current, storyId];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(READ_STORIES_KEY, JSON.stringify(updated));
  }
  return updated;
}

// Tasbih state persistence
export interface TasbihState {
  count: number;
  target: number;
  totalCycles: number;
  presetIndex: number;
}

export function loadTasbihState(): TasbihState {
  const fallback: TasbihState = { count: 0, target: 33, totalCycles: 0, presetIndex: 0 };
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(TASBIH_KEY);
    return data ? { ...fallback, ...JSON.parse(data) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveTasbihState(state: TasbihState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TASBIH_KEY, JSON.stringify(state));
  } catch {}
}
