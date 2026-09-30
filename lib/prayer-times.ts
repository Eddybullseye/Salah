import * as adhan from 'adhan';
import {
  HighLatitudeRuleType,
  MainPrayerName,
  MosqueTimetableOverride,
  PerPrayerCalculationConfig,
  PrayerAdjustment,
  PrayerCalculationMode,
  PrayerName,
  PrayerStatus,
  PrayerTimeDisplay,
  SoundSettings,
  UserProfile,
} from './types';

export const CALCULATION_METHODS = [
  {
    id: 'MuslimWorldLeague',
    label: 'Muslim World League (MWL)',
    description: 'Fajr 18°, Isha 17°. Widely used across Europe, Far East, and parts of the Americas.',
  },
  {
    id: 'ISNA',
    label: 'ISNA (North America)',
    description: 'Fajr 15°, Isha 15°. Standard across the USA, Canada, and North American Islamic centres.',
  },
  {
    id: 'Egyptian',
    label: 'Egyptian General Authority',
    description: 'Fajr 19.5°, Isha 17.5°. Standard in Egypt, Africa, Syria, Iraq, Lebanon, and Malaysia.',
  },
  {
    id: 'UmmAlQura',
    label: 'Umm al-Qura (Makkah)',
    description: 'Fajr 18.5°, Isha 90 min after Maghrib (120 min during Ramadan). Official calendar of Saudi Arabia.',
  },
  {
    id: 'Karachi',
    label: 'Univ. of Islamic Sciences, Karachi',
    description: 'Fajr 18°, Isha 18°. Standard across Pakistan, Bangladesh, India, and Afghanistan.',
  },
  {
    id: 'Dubai',
    label: 'Dubai (UAE)',
    description: 'Fajr 18.2°, Isha 18.2°. Official calendar of Dubai and the UAE General Authority.',
  },
  {
    id: 'Qatar',
    label: 'Qatar',
    description: 'Fajr 18°, Isha 90 min after Maghrib. Official Ministry of Awqaf & Islamic Affairs in Qatar.',
  },
  {
    id: 'Kuwait',
    label: 'Kuwait',
    description: 'Fajr 18°, Isha 17.5°. Official Ministry of Awqaf & Islamic Affairs in Kuwait.',
  },
  {
    id: 'Singapore',
    label: 'Singapore (MUIS)',
    description: 'Fajr 20°, Isha 18°. Majlis Ugama Islam Singapura, standard in Singapore and Brunei.',
  },
  {
    id: 'Tehran',
    label: 'Univ. of Tehran (Iran)',
    description: 'Fajr 17.7°, Maghrib 4.5°, Isha 14°. Institute of Geophysics, University of Tehran.',
  },
  {
    id: 'Turkey',
    label: 'Diyanet (Turkey)',
    description: 'Fajr 18°, Isha 17°. Official Presidency of Religious Affairs (Diyanet İşleri Başkanlığı) in Turkey.',
  },
  {
    id: 'MoonsightingCommittee',
    label: 'Moonsighting Committee',
    description: 'Astronomical research parameters based on Moonsighting Committee Worldwide criteria.',
  },
];

export const HIGH_LATITUDE_RULES: { id: HighLatitudeRuleType; label: string; description: string }[] = [
  {
    id: 'MiddleOfTheNight',
    label: 'Middle of the Night',
    description: 'Fajr and Isha never exceed half the duration of the night.',
  },
  {
    id: 'SeventhOfTheNight',
    label: 'Seventh of the Night',
    description: 'Fajr and Isha portioned as 1/7th of the night. Standard in higher UK/Northern latitudes.',
  },
  {
    id: 'TwilightAngle',
    label: 'Angle Based',
    description: 'Portioned according to sun twilight angle relative to latitude.',
  },
];

export const DEFAULT_PRAYER_MODES: Record<PrayerName, PerPrayerCalculationConfig> = {
  fajr: { mode: 'auto', offset_minutes: 0 },
  sunrise: { mode: 'auto', offset_minutes: 0 },
  dhuhr: { mode: 'auto', offset_minutes: 0 },
  asr: { mode: 'auto', offset_minutes: 0 },
  maghrib: { mode: 'auto', offset_minutes: 0 },
  isha: { mode: 'auto', offset_minutes: 0 },
};

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  default_voice_id: 'voice-makkah',
  volume: 0.85,
  prayers: {
    fajr: { sound_mode: 'adhan', voice_id: 'voice-makkah' },
    dhuhr: { sound_mode: 'adhan', voice_id: 'voice-makkah' },
    asr: { sound_mode: 'adhan', voice_id: 'voice-makkah' },
    maghrib: { sound_mode: 'adhan', voice_id: 'voice-makkah' },
    isha: { sound_mode: 'adhan', voice_id: 'voice-makkah' },
  },
  dnd_enabled: false,
  dnd_start_time: '23:00',
  dnd_end_time: '05:00',
  dnd_allow_fajr: true,
  pre_prayer_chime: true,
  nudge_tone: true,
  completion_tone: true,
  tasbih_sound: true,
  quran_recitation: false,
};

export const DEFAULT_PROFILE: UserProfile = {
  id: 'guest',
  display_name: 'Beloved Guest',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  latitude: 21.4225, // Makkah
  longitude: 39.8262,
  city_name: 'Makkah',
  country_name: 'Saudi Arabia',
  calculation_method: 'MuslimWorldLeague',
  asr_method: 'Standard',
  high_latitude_rule: 'MiddleOfTheNight',
  hijri_offset: 0,
  is_admin: false,
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  prayer_modes: DEFAULT_PRAYER_MODES,
  reminder_settings: {
    fajr: { enabled: true, offset: 0, nudge: 15 },
    dhuhr: { enabled: true, offset: 0, nudge: 15 },
    asr: { enabled: true, offset: 0, nudge: 15 },
    maghrib: { enabled: true, offset: 0, nudge: 15 },
    isha: { enabled: true, offset: 0, nudge: 15 },
    fajr_wakeup: true,
    fajr_wakeup_offset: 20,
    ayah_of_day: true,
    ayah_time: '08:00',
  },
  sound_settings: DEFAULT_SOUND_SETTINGS,
};

export function getCalculationParameters(
  methodName: string,
  highLatitudeRule: HighLatitudeRuleType = 'MiddleOfTheNight'
): adhan.CalculationParameters {
  let params: adhan.CalculationParameters;

  switch (methodName) {
    case 'Egyptian':
      params = adhan.CalculationMethod.Egyptian();
      break;
    case 'Karachi':
      params = adhan.CalculationMethod.Karachi();
      break;
    case 'UmmAlQura':
      params = adhan.CalculationMethod.UmmAlQura();
      break;
    case 'Dubai':
      params = adhan.CalculationMethod.Dubai();
      break;
    case 'Qatar':
      params = adhan.CalculationMethod.Qatar();
      break;
    case 'Kuwait':
      params = adhan.CalculationMethod.Kuwait();
      break;
    case 'Singapore':
      params = adhan.CalculationMethod.Singapore();
      break;
    case 'Tehran':
      params = adhan.CalculationMethod.Tehran();
      break;
    case 'Turkey':
      params = adhan.CalculationMethod.Turkey();
      break;
    case 'MoonsightingCommittee':
      params = adhan.CalculationMethod.MoonsightingCommittee();
      break;
    case 'ISNA':
      params = adhan.CalculationMethod.NorthAmerica();
      break;
    case 'MuslimWorldLeague':
    default:
      params = adhan.CalculationMethod.MuslimWorldLeague();
      break;
  }

  // High latitude rule
  if (highLatitudeRule === 'SeventhOfTheNight') {
    params.highLatitudeRule = adhan.HighLatitudeRule.SeventhOfTheNight;
  } else if (highLatitudeRule === 'TwilightAngle') {
    params.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
  } else {
    params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  }

  return params;
}

// Single Unified Calculation Engine
// Priority: 1. CSV / Date-specific override → 2. Manual fixed time → 3. Auto + minute offset → 4. Base calculated
export function calculatePrayerTimes(
  date: Date,
  profile: UserProfile,
  loggedStatuses: Record<string, PrayerStatus> = {},
  timetableOverrides: MosqueTimetableOverride[] = []
): {
  prayers: PrayerTimeDisplay[];
  currentPrayer: PrayerTimeDisplay | null;
  nextPrayer: PrayerTimeDisplay | null;
  rawPrayerTimes: adhan.PrayerTimes;
} {
  const coordinates = new adhan.Coordinates(profile.latitude, profile.longitude);
  const params = getCalculationParameters(profile.calculation_method, profile.high_latitude_rule);

  if (profile.asr_method === 'Hanafi') {
    params.madhab = adhan.Madhab.Hanafi;
  } else {
    params.madhab = adhan.Madhab.Shafi;
  }

  const rawPrayerTimes = new adhan.PrayerTimes(coordinates, date, params);

  const addMinutes = (d: Date, mins: number) => new Date(d.getTime() + mins * 60000);

  const formatTime = (d: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: profile.timezone || undefined,
    }).format(d);
  };

  // Date string for override lookup
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
  const dateOverride = timetableOverrides.find((o) => o.date === dateKey);

  const prayerDefs: { name: PrayerName; displayName: string; arabicName: string; baseDate: Date; isMain: boolean }[] = [
    { name: 'fajr', displayName: 'Fajr', arabicName: 'الفجر', baseDate: rawPrayerTimes.fajr, isMain: true },
    { name: 'sunrise', displayName: 'Sunrise', arabicName: 'الشروق', baseDate: rawPrayerTimes.sunrise, isMain: false },
    { name: 'dhuhr', displayName: 'Dhuhr', arabicName: 'الظهر', baseDate: rawPrayerTimes.dhuhr, isMain: true },
    { name: 'asr', displayName: 'Asr', arabicName: 'العصر', baseDate: rawPrayerTimes.asr, isMain: true },
    { name: 'maghrib', displayName: 'Maghrib', arabicName: 'المغرب', baseDate: rawPrayerTimes.maghrib, isMain: true },
    { name: 'isha', displayName: 'Isha', arabicName: 'العشاء', baseDate: rawPrayerTimes.isha, isMain: true },
  ];

  const now = new Date();

  const prayers: PrayerTimeDisplay[] = prayerDefs.map((def) => {
    const calculatedTimeStr = formatTime(def.baseDate);
    let finalDate = def.baseDate;
    let overrideType: 'offset' | 'fixed' | 'csv' | null = null;

    // 1. PRIORITY 1: CSV / Mosque Timetable Override for this specific date
    if (dateOverride && dateOverride[def.name]) {
      const timeVal = dateOverride[def.name]!.trim();
      const parts = timeVal.split(':');
      if (parts.length === 2) {
        const [h, m] = parts.map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const d = new Date(date);
          d.setHours(h, m, 0, 0);
          finalDate = d;
          overrideType = 'csv';
        }
      }
    }

    // 2. PRIORITY 2: Manual Fixed Time (if mode === 'fixed')
    if (!overrideType) {
      const pMode = profile.prayer_modes?.[def.name];
      if (pMode && pMode.mode === 'fixed' && pMode.fixed_time) {
        let isWithinRange = true;
        if (pMode.fixed_start_date && dateKey < pMode.fixed_start_date) isWithinRange = false;
        if (pMode.fixed_end_date && dateKey > pMode.fixed_end_date) isWithinRange = false;

        if (isWithinRange) {
          const parts = pMode.fixed_time.split(':');
          if (parts.length === 2) {
            const [h, m] = parts.map(Number);
            if (!isNaN(h) && !isNaN(m)) {
              const d = new Date(date);
              d.setHours(h, m, 0, 0);
              finalDate = d;
              overrideType = 'fixed';
            }
          }
        }
      }
    }

    // 3. PRIORITY 3: Minute Offsets (-60 to +60)
    if (!overrideType) {
      const pMode = profile.prayer_modes?.[def.name];
      const offsetMins =
        pMode && pMode.mode === 'offset'
          ? pMode.offset_minutes
          : profile.adjustments?.[def.name] ?? 0;

      if (offsetMins !== 0) {
        finalDate = addMinutes(def.baseDate, offsetMins);
        overrideType = 'offset';
      }
    }

    const timeStr = formatTime(finalDate);
    const isPassed = finalDate.getTime() < now.getTime();
    const status = loggedStatuses[def.name] || null;

    return {
      name: def.name,
      displayName: def.displayName,
      arabicName: def.arabicName,
      timeStr,
      calculatedTimeStr,
      dateObj: finalDate,
      isMainPrayer: def.isMain,
      isPassed,
      isCurrent: false, // Calculated below
      isNext: false,    // Calculated below
      status,
      overrideType,
    };
  });

  // Calculate current and next prayer from finalized dates
  let nextIndex = prayers.findIndex((p) => p.dateObj.getTime() > now.getTime());
  let currentIndex = -1;

  if (nextIndex === -1) {
    currentIndex = 5; // Isha
  } else if (nextIndex === 0) {
    currentIndex = -1;
  } else {
    currentIndex = nextIndex - 1;
  }

  prayers.forEach((p, idx) => {
    p.isCurrent = idx === currentIndex;
    p.isNext = idx === nextIndex;
  });

  const currentPrayer = currentIndex >= 0 ? prayers[currentIndex] : null;
  const nextPrayer = nextIndex >= 0 ? prayers[nextIndex] : null;

  return {
    prayers,
    currentPrayer,
    nextPrayer,
    rawPrayerTimes,
  };
}

// Compare all 12 calculation methods side-by-side for today
export function compareAllCalculationMethods(
  date: Date,
  profile: UserProfile
): {
  id: string;
  label: string;
  description: string;
  times: Record<PrayerName, string>;
}[] {
  const coordinates = new adhan.Coordinates(profile.latitude, profile.longitude);

  return CALCULATION_METHODS.map((method) => {
    const params = getCalculationParameters(method.id, profile.high_latitude_rule);
    if (profile.asr_method === 'Hanafi') {
      params.madhab = adhan.Madhab.Hanafi;
    } else {
      params.madhab = adhan.Madhab.Shafi;
    }

    const raw = new adhan.PrayerTimes(coordinates, date, params);

    const fmt = (d: Date) =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: profile.timezone || undefined,
      }).format(d);

    return {
      id: method.id,
      label: method.label,
      description: method.description,
      times: {
        fajr: fmt(raw.fajr),
        sunrise: fmt(raw.sunrise),
        dhuhr: fmt(raw.dhuhr),
        asr: fmt(raw.asr),
        maghrib: fmt(raw.maghrib),
        isha: fmt(raw.isha),
      },
    };
  });
}

// Calculate Hijri Date with lunar moon sighting offset (-2 to +2 days)
export function getHijriDate(date: Date = new Date(), hijriOffset = 0): {
  day: number;
  monthName: string;
  year: number;
  formatted: string;
  formattedArabic: string;
} {
  try {
    const adjustedDate = new Date(date.getTime() + hijriOffset * 86400000);

    const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = hijriFormatter.formatToParts(adjustedDate);
    let day = 1;
    let monthName = '';
    let year = 1448;

    for (const p of parts) {
      if (p.type === 'day') day = parseInt(p.value, 10) || 1;
      if (p.type === 'month') monthName = p.value;
      if (p.type === 'year') year = parseInt(p.value, 10) || 1448;
    }

    const arabicFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedArabic = arabicFormatter.format(adjustedDate);
    const formatted = `${day} ${monthName} ${year} AH`;

    return { day, monthName, year, formatted, formattedArabic };
  } catch {
    return {
      day: 17,
      monthName: 'Rabiʻ al-Awwal',
      year: 1448,
      formatted: '17 Rabiʻ al-Awwal 1448 AH',
      formattedArabic: '١٧ ربيع الأول ١٤٤٨ هـ',
    };
  }
}

// Generate Downloadable CSV Timetable Template
export function generateMosqueTimetableCSVTemplate(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');

  let csv = 'date,fajr,sunrise,dhuhr,asr,maghrib,isha\n';
  for (let day = 1; day <= 5; day++) {
    const dStr = String(day).padStart(2, '0');
    csv += `${y}-${m}-${dStr},05:15,06:30,12:20,15:45,18:10,19:40\n`;
  }
  return csv;
}

// Parse and validate imported Mosque Timetable CSV
export function parseMosqueTimetableCSV(csvText: string): {
  valid: boolean;
  records: MosqueTimetableOverride[];
  errors: string[];
} {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return { valid: false, records: [], errors: ['CSV file is empty or has no header line.'] };
  }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const expectedCols = ['date', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  const hasAllCols = expectedCols.every((col) => header.includes(col));
  if (!hasAllCols) {
    return {
      valid: false,
      records: [],
      errors: [`Header missing required columns. Expected: ${expectedCols.join(', ')}`],
    };
  }

  const colIndexes: Record<string, number> = {};
  expectedCols.forEach((col) => {
    colIndexes[col] = header.indexOf(col);
  });

  const records: MosqueTimetableOverride[] = [];
  const errors: string[] = [];

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split(',').map((c) => c.trim());
    if (cells.length < expectedCols.length) continue;

    const rowDate = cells[colIndexes['date']];
    if (!dateRegex.test(rowDate)) {
      errors.push(`Line ${i + 1}: Invalid date format "${rowDate}". Must be YYYY-MM-DD.`);
      continue;
    }

    const rowItem: MosqueTimetableOverride = { date: rowDate };

    const prayersList: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const p of prayersList) {
      const val = cells[colIndexes[p]];
      if (val) {
        if (!timeRegex.test(val)) {
          errors.push(`Line ${i + 1} (${p}): Invalid time format "${val}". Must be HH:MM in 24h.`);
        } else {
          rowItem[p] = val;
        }
      }
    }

    records.push(rowItem);
  }

  return {
    valid: errors.length === 0 && records.length > 0,
    records,
    errors,
  };
}

export function formatCountdown(targetDate: Date): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, formatted };
}

// Calculate Qibla bearing from coordinates to Kaaba in Makkah (21.4225, 39.8262)
export function calculateQiblaBearing(latitude: number, longitude: number): number {
  const kaabaLat = (21.422487 * Math.PI) / 180;
  const kaabaLng = (39.826206 * Math.PI) / 180;
  const userLat = (latitude * Math.PI) / 180;
  const userLng = (longitude * Math.PI) / 180;

  const y = Math.sin(kaabaLng - userLng);
  const x =
    Math.cos(userLat) * Math.tan(kaabaLat) -
    Math.sin(userLat) * Math.cos(kaabaLng - userLng);

  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  qibla = (qibla + 360) % 360;
  return Math.round(qibla);
}
