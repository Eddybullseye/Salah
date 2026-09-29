# Salah Companion - Testing & Verification Checklist

Use this checklist to verify full functionality across PWA installation, prayer time calculations, push reminders, prayer tracking, Islamic storytelling, Qibla compass, and offline performance.

---

## ⚡ How to Test a Notification Within 1 Minute

### Method A: Immediate In-App Test (Instant)
1. Open the app on your phone, tablet, or browser.
2. Tap the **Settings** tab at the bottom.
3. Tap **Enable Reminders** to grant browser notification permission.
4. Tap the **Test (1-min)** button.
5. An immediate test notification titled *"It's time for Asr 🤍"* will trigger on your lock screen/notification tray with interactive buttons:
   - **✓ I prayed** (automatically marks the prayer as completed)
   - **⏰ Remind in 10m** (snoozes the notification)

### Method B: Edge Function 1-Minute Cron Test
1. In your **Settings**, note down the current minute (e.g. 14:32).
2. Set your current upcoming prayer (e.g., Asr or Dhuhr) minute adjustment in Settings to match the upcoming minute (`HH:MM`).
3. Or manually trigger the Edge Function via cURL:
   ```bash
   curl -X POST https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-prayer-reminders \
     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
     -H "Content-Type: application/json"
   ```
4. Verify the response JSON shows `notificationsSent: 1` and your device displays the lock screen push.

---

## 📱 PWA & Mobile Installation Checklist

- [ ] **iOS Safari Onboarding**:
  - Open in iOS Safari in browser mode.
  - Verify the top banner displays "Install Salah Companion".
  - Tap "Install" and verify the step-by-step modal guide (Share icon → "Add to Home Screen").
- [ ] **iOS Standalone Mode**:
  - Launch the app from the Home Screen icon.
  - Verify that the browser navigation toolbar is hidden (`display: standalone`).
  - Verify the status bar uses translucent emerald theme styling.
- [ ] **Android / Chrome Install Prompt**:
  - Open in Chrome; verify the `beforeinstallprompt` button triggers the native installation modal.
  - Open from the Android app drawer; verify the 512x512 splash screen and theme color.
- [ ] **Offline Resilience**:
  - Turn on Airplane Mode or disconnect Wi-Fi.
  - Reload the page.
  - Verify that the app shell loads from cache, prayer times continue to calculate accurately via the offline `adhan` library, and the offline indicator pill appears.

---

## 🕌 Prayer Times Engine Checklist

- [ ] **GPS Geolocation**:
  - Tap the location button in the header; verify it updates coordinates and city name.
- [ ] **Calculation Authority**:
  - In Settings, switch between Muslim World League, ISNA, and Umm al-Qura.
  - Verify the prayer times update instantly.
- [ ] **Asr Juristic Method**:
  - Toggle between Standard (Shafi/Maliki/Hanbali) and Hanafi.
  - Verify that Asr time shifts by approximately 45–60 minutes.
- [ ] **Live Countdown**:
  - Verify that the countdown clock on the Hero card ticks down by seconds in real time.
- [ ] **Hijri Date**:
  - Verify the English and Arabic Hijri date is displayed correctly in the header.

---

## 📊 Prayer Tracker Checklist

- [ ] **One-Tap Logging**:
  - Tap "Mark as Prayed" on the current prayer.
  - Select "On Time", "Late", "Qada", or "Missed".
  - Verify that the status badge updates and the prayer logs table records the entry.
- [ ] **Consistency Heatmap**:
  - Verify that the 30-day heatmap colors each cell according to prayers completed (0 to 5).
  - Tap any day cell to review or log past prayers for that date.
- [ ] **Streak Calculation**:
  - Verify the Current Streak and Best Streak counters increment accurately.
- [ ] **Weekly Bar Chart**:
  - Verify the 7-day bar chart shows individual day completion bars.

---

## 📖 Islamic Content & Storytelling Checklist

- [ ] **Authentic Prophet Stories**:
  - Navigate to the **Learn** tab.
  - Open any of the 5 seeded stories (Ibrahim AS, Musa AS, Yunus AS, Yusuf AS, Al-Isra' wal-Mi'raj).
  - Verify authentic source citations, read time, and typography.
  - Tap "Mark as Read" and verify the read status persists.
- [ ] **Admin Story Management**:
  - Tap "Add Story (Admin)" in the Stories header.
  - Fill out title, category, source, summary, and narrative.
  - Tap "Save Story" and verify it renders immediately in the feed.
- [ ] **Duas with Audio & Copy**:
  - In the Duas tab, tap the Copy icon on any supplication.
  - Verify Arabic text, transliteration, and English translation copy to clipboard.
- [ ] **Bookmarks**:
  - Tap the bookmark icon on any story, dua, or ayah.
  - Open the "Saved" tab and verify the items are bookmarked.

---

## 🧭 Extras Checklist

- [ ] **Qibla Compass**:
  - Tap the compass icon in the header.
  - On iOS, tap "Enable Compass Sensor" to grant device orientation permission.
  - Rotate your device and verify the Kaaba needle points toward Makkah.
- [ ] **Digital Tasbih**:
  - Tap the Tasbih icon in the header.
  - Tap the central bead button.
  - Verify haptic vibration on supported devices (`navigator.vibrate`).
  - Switch dhikr presets (SubhanAllah, Alhamdulillah, Allahu Akbar, Astaghfirullah).
  - Reach target count (33) and verify completed cycle counter increments.
- [ ] **Ramadan Mode**:
  - In Settings, toggle "Ramadan Mode".
  - Return to Home and verify the Suhoor cutoff and Iftar countdown card appears.
