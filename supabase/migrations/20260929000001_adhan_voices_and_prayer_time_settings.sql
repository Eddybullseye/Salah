-- ============================================================================
-- SALAH COMPANION: ADHAN VOICES & PRAYER TIME SETTINGS / OVERRIDES MIGRATION
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ADHAN VOICES TABLE (Public Audio Library)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.adhan_voices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muezzin TEXT NOT NULL,
  file_url TEXT NOT NULL,
  fajr_file_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 180,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  style_region TEXT, -- 'makkah', 'madinah', 'al_aqsa', 'soft_tone'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for adhan_voices (Readable by everyone, manageable by admins)
ALTER TABLE public.adhan_voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adhan voices are publicly readable"
  ON public.adhan_voices
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify adhan voices"
  ON public.adhan_voices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Seed Initial Adhan Voices (Public domain / CC licensed placeholder URLs)
INSERT INTO public.adhan_voices (id, name, muezzin, file_url, fajr_file_url, duration_seconds, is_default, description, style_region)
VALUES
(
  'voice-makkah',
  'Makkah Al-Mukarramah',
  'Sheikh Ali Ahmad Mulla',
  '/audio/adhan-makkah.mp3',
  '/audio/adhan-makkah-fajr.mp3',
  210,
  TRUE,
  'Traditional majestic Hijazi adhan chanted from the minarets of the Grand Mosque (Masjid al-Haram).',
  'makkah'
),
(
  'voice-madinah',
  'Madinah Al-Munawwarah',
  'Sheikh Essam Bukhari',
  '/audio/adhan-madinah.mp3',
  '/audio/adhan-madinah-fajr.mp3',
  195,
  FALSE,
  'Calm, serene, and resonant calling to prayer from the Prophet’s Mosque (Al-Masjid an-Nabawi).',
  'madinah'
),
(
  'voice-alaqsa',
  'Al-Aqsa Sanctuary',
  'Jerusalem Traditional Minaret',
  '/audio/adhan-alaqsa.mp3',
  '/audio/adhan-alaqsa-fajr.mp3',
  225,
  FALSE,
  'Soulful, moving Maqam Bayati adhan evoking the ancient heritage of Al-Haram al-Sharif.',
  'al_aqsa'
),
(
  'voice-soft-reminder',
  'Soft Harmonic Chime',
  'Serene Acoustic Tone',
  '/audio/soft-chime.mp3',
  '/audio/soft-chime.mp3',
  15,
  FALSE,
  'Gentle three-note acoustic bell designed for quiet offices and light sleepers.',
  'soft_tone'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  muezzin = EXCLUDED.muezzin,
  file_url = EXCLUDED.file_url,
  fajr_file_url = EXCLUDED.fajr_file_url,
  duration_seconds = EXCLUDED.duration_seconds,
  description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 2. PRAYER TIME SETTINGS TABLE (Per-user calculation & mode configuration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prayer_time_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_method TEXT NOT NULL DEFAULT 'MuslimWorldLeague',
  asr_method TEXT NOT NULL DEFAULT 'Standard',
  high_latitude_rule TEXT NOT NULL DEFAULT 'MiddleOfTheNight',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  latitude DOUBLE PRECISION NOT NULL DEFAULT 21.4225,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 39.8262,
  hijri_offset INTEGER NOT NULL DEFAULT 0 CHECK (hijri_offset >= -2 AND hijri_offset <= 2),
  
  -- Per-prayer offsets (-60 to +60 minutes)
  fajr_offset INTEGER NOT NULL DEFAULT 0 CHECK (fajr_offset >= -60 AND fajr_offset <= 60),
  sunrise_offset INTEGER NOT NULL DEFAULT 0 CHECK (sunrise_offset >= -60 AND sunrise_offset <= 60),
  dhuhr_offset INTEGER NOT NULL DEFAULT 0 CHECK (dhuhr_offset >= -60 AND dhuhr_offset <= 60),
  asr_offset INTEGER NOT NULL DEFAULT 0 CHECK (asr_offset >= -60 AND asr_offset <= 60),
  maghrib_offset INTEGER NOT NULL DEFAULT 0 CHECK (maghrib_offset >= -60 AND maghrib_offset <= 60),
  isha_offset INTEGER NOT NULL DEFAULT 0 CHECK (isha_offset >= -60 AND isha_offset <= 60),

  -- Per-prayer modes ('auto', 'offset', 'fixed')
  fajr_mode TEXT NOT NULL DEFAULT 'auto' CHECK (fajr_mode IN ('auto', 'offset', 'fixed')),
  sunrise_mode TEXT NOT NULL DEFAULT 'auto' CHECK (sunrise_mode IN ('auto', 'offset', 'fixed')),
  dhuhr_mode TEXT NOT NULL DEFAULT 'auto' CHECK (dhuhr_mode IN ('auto', 'offset', 'fixed')),
  asr_mode TEXT NOT NULL DEFAULT 'auto' CHECK (asr_mode IN ('auto', 'offset', 'fixed')),
  maghrib_mode TEXT NOT NULL DEFAULT 'auto' CHECK (maghrib_mode IN ('auto', 'offset', 'fixed')),
  isha_mode TEXT NOT NULL DEFAULT 'auto' CHECK (isha_mode IN ('auto', 'offset', 'fixed')),

  -- Manual fixed times (HH:MM in 24h format)
  fajr_fixed_time TEXT,
  sunrise_fixed_time TEXT,
  dhuhr_fixed_time TEXT,
  asr_fixed_time TEXT,
  maghrib_fixed_time TEXT,
  isha_fixed_time TEXT,

  -- Sound & Adhan configuration
  sound_settings JSONB NOT NULL DEFAULT '{
    "default_voice_id": "voice-makkah",
    "volume": 0.85,
    "prayers": {
      "fajr": {"sound_mode": "adhan", "voice_id": "voice-makkah"},
      "dhuhr": {"sound_mode": "adhan", "voice_id": "voice-makkah"},
      "asr": {"sound_mode": "adhan", "voice_id": "voice-makkah"},
      "maghrib": {"sound_mode": "adhan", "voice_id": "voice-makkah"},
      "isha": {"sound_mode": "adhan", "voice_id": "voice-makkah"}
    },
    "dnd_enabled": false,
    "dnd_start_time": "23:00",
    "dnd_end_time": "05:00",
    "dnd_allow_fajr": true,
    "pre_prayer_chime": true,
    "nudge_tone": true,
    "completion_tone": true,
    "tasbih_sound": true,
    "quran_recitation": false
  }'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prayer_time_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prayer time settings"
  ON public.prayer_time_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. PRAYER TIME OVERRIDES TABLE (CSV Timetables & Date-Specific Overrides)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prayer_time_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  prayer TEXT NOT NULL CHECK (prayer IN ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha')),
  time TEXT NOT NULL, -- Format: HH:MM (24-hour)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_date_prayer UNIQUE (user_id, date, prayer)
);

CREATE INDEX IF NOT EXISTS idx_overrides_lookup ON public.prayer_time_overrides(user_id, date);

ALTER TABLE public.prayer_time_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prayer time overrides"
  ON public.prayer_time_overrides
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. SUPABASE STORAGE SETUP FOR ADHAN AUDIO FILES
-- ----------------------------------------------------------------------------
-- Setup public bucket "adhan" in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'adhan',
  'adhan',
  TRUE,
  20971520, -- 20 MB max file size
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 20971520;

-- Public Storage Policy: anyone can read/listen to adhan audio
CREATE POLICY "Public Read Access for Adhan Audio"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'adhan');

-- Admin/Authenticated Upload Access for Adhan Audio
CREATE POLICY "Authenticated Upload Access for Adhan Audio"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'adhan' AND
    auth.role() = 'authenticated'
  );
