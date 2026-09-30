# Salah Companion — Production Documentation

A modern, offline-first Progressive Web App (PWA) designed to anchor the believer’s daily routine around the five daily prayers (*Fajr, Dhuhr, Asr, Maghrib, Isha*), featuring authentic adhan audio, accurate prayer time calculation with custom mosque offsets, rich Islamic stories, and digital tasbih.

---

## 1. Adhan & Islamic Audio System

### Supabase Storage Bucket Setup
1. In your **Supabase Dashboard**, navigate to **Storage > New Bucket**.
2. Name the bucket: `adhan`
3. Toggle **Public bucket** to `ON` (allowing public read streaming of adhan files).
4. Set allowed MIME types: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, `audio/aac`.
5. Upload your verified adhan audio files into the root or folders of the bucket:
   - `makkah-adhan.mp3`
   - `makkah-fajr-adhan.mp3` *(must include "As-salatu khayrun minan-nawm")*
   - `madinah-adhan.mp3`
   - `madinah-fajr-adhan.mp3`
   - `alaqsa-adhan.mp3`
   - `alaqsa-fajr-adhan.mp3`
   - `soft-reminder-chime.mp3`

Public URL pattern:
`https://<YOUR-PROJECT-ID>.supabase.co/storage/v1/object/public/adhan/<filename>.mp3`

### Audio Licensing & Attribution Notice
> **IMPORTANT LICENSING REQUIREMENT:**
> All default adhan audio files referenced in the codebase are mapped to local fallback endpoints (`/audio/*`) and synthesized harmonic acoustic models. To utilize real voice recordings in production, **you must supply your own verified public domain, Creative Commons (CC-BY / CC0), or licensed audio recordings**.
> 
> - **Do NOT** hotlink audio files from unauthorized third-party websites.
> - **Fajr recordings** must contain the sacred addition: *الصلاة خير من النوم* (*As-salatu khayrun minan-nawm*).
> - High-quality public domain adhan recordings can be sourced from open Islamic archival repositories with explicit Creative Commons licenses.

### Database Schema: `adhan_voices`
```sql
CREATE TABLE public.adhan_voices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muezzin TEXT NOT NULL,
  file_url TEXT NOT NULL,
  fajr_file_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 180,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  style_region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Offline Caching Architecture (Service Worker Cache API)
- The service worker (`public/sw.js`) manages a dedicated audio cache `salah-adhan-cache-v1`.
- When an adhan starts or when the user taps **"Cache Audio Offline"** in Settings, the audio files are saved in the browser's Cache API via `adhanAudio.preloadAllAdhanAudio()`.
- On subsequent prayer calls, the audio is retrieved Cache-First via `URL.createObjectURL(blob)`, enabling full offline adhan recitation even with airplane mode enabled.
- Procedural Web Audio API synthesizers act as an instant acoustic fallback if a network or audio file error occurs.

### Playback Behavior & Mobile OS Limitations
- **Foreground Auto-Play:** When the web app is open at prayer time, the adhan plays automatically and renders the full-screen `AdhanPlayingModal` with **Stop**, **Snooze (10 min)**, and **I Prayed** buttons.
- **iOS User Gesture Unlock:** iOS Safari requires a user gesture before web audio can play. Onboarding includes an **"Enable Adhan Sound"** button that unlocks the Web Audio Context and primes HTMLAudio playback.
- **Deep Linking (`/adhan?prayer=<name>`):** When push notifications are tapped from the lock screen, the app opens `/adhan?prayer=asr` (or appropriate prayer) and triggers immediate autoplay, with a large, accessible "Play Adhan" button if blocked.
- **Media Session API:** Lock screen and Bluetooth controls automatically display:
  - Title: `Adhan – Asr`
  - Artist: `Sheikh Ali Ahmad Mulla (Makkah Al-Mukarramah)`
  - Album: `Salah Companion`
  - Responsive album art (192x192 and 512x512 icons)
  - Hardware buttons for Play, Pause, and Stop.
- **Background Notice:** Mobile operating systems (iOS and Android) restrict unprompted background audio for web apps when killed. Push notifications bridge this gap by delivering instant lock-screen alerts that deep-link directly to audio recitation.

---

## 2. Android PWA Installation & Reliable Reminders

### Manifest & Service Worker Compliance
- **Manifest (`public/manifest.json`):**
  - `display`: `"standalone"`
  - `display_override`: `["standalone", "minimal-ui"]`
  - `orientation`: `"portrait-primary"`
  - High-resolution icons: `192x192`, `512x512`, and `maskable 512x512` safe-zone compliant icon.
  - Screenshots: Phone portrait screenshot and tablet wide screenshot for Chrome's rich install UI.
  - Shortcuts: Quick access to *"Next prayer"*, *"Mark prayer done"*, and *"Digital Tasbih"*.
- **Service Worker (`public/sw.js`):** Offline caching, background push notification listener, notification action buttons (`I Prayed`, `Snooze 10m`), vibration patterns `[200, 100, 200]`, and monochrome notification badge.

### Shareable `/install` Page
The `/install` route provides step-by-step instructions for all platforms:
- **Android (Chrome / Samsung Internet):** One-tap install button utilizing the native `beforeinstallprompt` event.
- **Android (Firefox):** Instructions to tap *Menu (⋮) > Install / Add to Home screen*.
- **iOS Safari:** Instructions to tap *Share (box with arrow) > Add to Home Screen*.
- **Desktop (Chrome / Edge):** Address-bar install icon guidance.

### Android Reliable Notification Tips
Certain Android vendors (Samsung, Xiaomi, Oppo, OnePlus) employ aggressive battery killers that terminate web push services. The onboarding guide recommends:
1. Setting battery optimization to **"Unrestricted"** for Chrome / the installed app.
2. Turning off *"Pause app activity if unused"*.
3. Allowing sound exceptions under **Do Not Disturb** if night adhans are desired.

---

## 3. Prayer Time Calculations & Mosque Timetable Adjustments

### Unified Calculation Engine (`lib/prayer-times.ts`)
The calculation follows a strict 4-tier hierarchy:
1. **Priority 1: Mosque Timetable (CSV Override):** Matches exact timetable files provided by local mosques for specific dates.
2. **Priority 2: Manual Fixed Time:** User-configured static time (e.g. fixed 1:15 PM Dhuhr jama'ah).
3. **Priority 3: Minute Offsets (-60 to +60 min):** Fine-tuning stepper per prayer.
4. **Priority 4: Base Astronomical Calculation:** Powered by the `adhan` library with selected calculation authority.

### 12 Calculation Authorities & Side-by-Side Comparison
Users can compare prayer times across 12 major Islamic calculation authorities side-by-side:
- Muslim World League (MWL)
- Islamic Society of North America (ISNA)
- Egyptian General Authority of Survey
- Umm al-Qura University, Makkah
- University of Islamic Sciences, Karachi
- Dubai (UAE)
- Qatar
- Kuwait
- Singapore (MUIS)
- Tehran (Institute of Geophysics)
- Diyanet İşleri Başkanlığı (Turkey)
- Moonsighting Committee Worldwide

### High-Latitude Rules & Asr Juristic Method
- **Asr Juristic Madhab:** Standard (Shafi'i/Maliki/Hanbali, shadow ratio 1x) vs. Hanafi (shadow ratio 2x).
- **High-Latitude Twilight Rules:** Middle of the Night, Seventh of the Night, Angle-based twilight portion.
- **Lunar Hijri Offset:** -2 to +2 days adjuster to match local moon sighting announcements.

---

## 4. Environment Variables

Create a `.env.local` file with the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-web-push-vapid-public-key>
```

---

## 5. Development & Verification

Run the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```
