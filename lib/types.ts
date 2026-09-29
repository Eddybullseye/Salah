export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type MainPrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerStatus = 'on_time' | 'late' | 'missed' | 'qada';

export interface PrayerAdjustment {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface ReminderPrayerSetting {
  enabled: boolean;
  offset: number; // 0 = at time, 5, 10, 15, 30 minutes before
  nudge: number;  // 0 = none, 15, 30 minutes after if not prayed
}

export interface ReminderSettings {
  fajr: ReminderPrayerSetting;
  dhuhr: ReminderPrayerSetting;
  asr: ReminderPrayerSetting;
  maghrib: ReminderPrayerSetting;
  isha: ReminderPrayerSetting;
  fajr_wakeup: boolean;
  fajr_wakeup_offset: number; // e.g. 20 min before
  ayah_of_day: boolean;
  ayah_time: string; // e.g. "08:00"
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  timezone: string;
  latitude: number;
  longitude: number;
  city_name: string;
  country_name: string;
  calculation_method: string;
  asr_method: 'Standard' | 'Hanafi';
  is_admin?: boolean;
  adjustments: PrayerAdjustment;
  reminder_settings: ReminderSettings;
  created_at?: string;
  updated_at?: string;
}

export interface PrayerLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  prayer: MainPrayerName;
  status: PrayerStatus;
  notes?: string | null;
  logged_at: string;
}

export interface PrayerTimeDisplay {
  name: PrayerName;
  displayName: string;
  arabicName: string;
  timeStr: string;
  dateObj: Date;
  isMainPrayer: boolean;
  isPassed: boolean;
  isCurrent: boolean;
  isNext: boolean;
  status?: PrayerStatus | null;
}

export interface StoryCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
}

export interface StoryTag {
  id: string;
  name: string;
}

export interface IslamicStory {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  source: string;
  tags: string[];
  read_time_minutes: number;
  order_index: number;
  published: boolean;
  created_at?: string;
  is_read?: boolean;
  is_bookmarked?: boolean;
}

export interface DuaItem {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  category: 'morning_evening' | 'prayer' | 'forgiveness' | 'daily' | 'guidance';
  source: string;
  benefits?: string | null;
  is_bookmarked?: boolean;
}

export interface DailyAyahHadith {
  id: string;
  type: 'ayah' | 'hadith';
  arabic: string;
  translation: string;
  source: string;
  theme: string;
  reflection?: string | null;
  day_of_year?: number;
  is_bookmarked?: boolean;
}

export interface StreakStats {
  currentStreak: number;
  bestStreak: number;
  totalPrayed: number;
  onTimeCount: number;
  lateCount: number;
  qadaCount: number;
  missedCount: number;
  completionRate7Days: number;
  completionRate30Days: number;
}
