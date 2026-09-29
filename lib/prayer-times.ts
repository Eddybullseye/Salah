import * as adhan from 'adhan';
import {
  MainPrayerName,
  PrayerAdjustment,
  PrayerName,
  PrayerStatus,
  PrayerTimeDisplay,
  UserProfile,
} from './types';

export const CALCULATION_METHODS = [
  { id: 'MuslimWorldLeague', label: 'Muslim World League (MWL)' },
  { id: 'ISNA', label: 'ISNA (North America)' },
  { id: 'Egyptian', label: 'Egyptian General Authority' },
  { id: 'UmmAlQura', label: 'Umm al-Qura (Makkah)' },
  { id: 'Karachi', label: 'Univ. of Islamic Sciences, Karachi' },
  { id: 'Dubai', label: 'Dubai (UAE)' },
  { id: 'Qatar', label: 'Qatar' },
  { id: 'Kuwait', label: 'Kuwait' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
];

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
  is_admin: false,
  adjustments: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
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
};

export function getCalculationParameters(methodName: string): adhan.CalculationParameters {
  switch (methodName) {
    case 'Egyptian':
      return adhan.CalculationMethod.Egyptian();
    case 'Karachi':
      return adhan.CalculationMethod.Karachi();
    case 'UmmAlQura':
      return adhan.CalculationMethod.UmmAlQura();
    case 'Dubai':
      return adhan.CalculationMethod.Dubai();
    case 'Qatar':
      return adhan.CalculationMethod.Qatar();
    case 'Kuwait':
      return adhan.CalculationMethod.Kuwait();
    case 'MoonsightingCommittee':
      return adhan.CalculationMethod.MoonsightingCommittee();
    case 'ISNA':
      return adhan.CalculationMethod.NorthAmerica();
    case 'MuslimWorldLeague':
    default:
      return adhan.CalculationMethod.MuslimWorldLeague();
  }
}

export function calculatePrayerTimes(
  date: Date,
  profile: UserProfile,
  loggedStatuses: Record<string, PrayerStatus> = {}
): {
  prayers: PrayerTimeDisplay[];
  currentPrayer: PrayerTimeDisplay | null;
  nextPrayer: PrayerTimeDisplay | null;
  rawPrayerTimes: adhan.PrayerTimes;
} {
  const coordinates = new adhan.Coordinates(profile.latitude, profile.longitude);
  const params = getCalculationParameters(profile.calculation_method);

  if (profile.asr_method === 'Hanafi') {
    params.madhab = adhan.Madhab.Hanafi;
  } else {
    params.madhab = adhan.Madhab.Shafi;
  }

  const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
  const adjustments = profile.adjustments || { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  const addMinutes = (d: Date, mins: number) => new Date(d.getTime() + mins * 60000);

  const formatTime = (d: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: profile.timezone || undefined,
    }).format(d);
  };

  const now = new Date();

  const fajrDate = addMinutes(prayerTimes.fajr, adjustments.fajr || 0);
  const sunriseDate = prayerTimes.sunrise;
  const dhuhrDate = addMinutes(prayerTimes.dhuhr, adjustments.dhuhr || 0);
  const asrDate = addMinutes(prayerTimes.asr, adjustments.asr || 0);
  const maghribDate = addMinutes(prayerTimes.maghrib, adjustments.maghrib || 0);
  const ishaDate = addMinutes(prayerTimes.isha, adjustments.isha || 0);

  const rawList: {
    name: PrayerName;
    displayName: string;
    arabicName: string;
    dateObj: Date;
    isMainPrayer: boolean;
  }[] = [
    { name: 'fajr', displayName: 'Fajr', arabicName: 'الفجر', dateObj: fajrDate, isMainPrayer: true },
    { name: 'sunrise', displayName: 'Sunrise', arabicName: 'الشروق', dateObj: sunriseDate, isMainPrayer: false },
    { name: 'dhuhr', displayName: 'Dhuhr', arabicName: 'الظهر', dateObj: dhuhrDate, isMainPrayer: true },
    { name: 'asr', displayName: 'Asr', arabicName: 'العصر', dateObj: asrDate, isMainPrayer: true },
    { name: 'maghrib', displayName: 'Maghrib', arabicName: 'المغرب', dateObj: maghribDate, isMainPrayer: true },
    { name: 'isha', displayName: 'Isha', arabicName: 'العشاء', dateObj: ishaDate, isMainPrayer: true },
  ];

  // Determine current & next prayer
  // Next prayer is the first prayer whose time is in the future
  let nextIndex = rawList.findIndex((p) => p.dateObj.getTime() > now.getTime());
  let currentIndex = -1;

  if (nextIndex === -1) {
    // All prayers for today have passed: current is Isha, next is tomorrow's Fajr
    currentIndex = 5;
  } else if (nextIndex === 0) {
    // Before Fajr: current is yesterday's Isha, next is Fajr
    currentIndex = -1;
  } else {
    // Current is previous prayer
    currentIndex = nextIndex - 1;
  }

  const prayers: PrayerTimeDisplay[] = rawList.map((item, index) => {
    const isPassed = item.dateObj.getTime() < now.getTime();
    const isCurrent = index === currentIndex;
    const isNext = index === nextIndex;
    const status = loggedStatuses[item.name] || null;

    return {
      ...item,
      timeStr: formatTime(item.dateObj),
      isPassed,
      isCurrent,
      isNext,
      status,
    };
  });

  const currentPrayer = currentIndex >= 0 ? prayers[currentIndex] : null;
  const nextPrayer = nextIndex >= 0 ? prayers[nextIndex] : null;

  return {
    prayers,
    currentPrayer,
    nextPrayer,
    rawPrayerTimes: prayerTimes,
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

// Calculate Hijri Date with Arabic & English representation
export function getHijriDate(date: Date = new Date()): {
  day: number;
  monthName: string;
  year: number;
  formatted: string;
  formattedArabic: string;
} {
  try {
    const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = hijriFormatter.formatToParts(date);
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
    const formattedArabic = arabicFormatter.format(date);
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
  qibla = (qibla + 360) % 360; // Normalize 0 - 360
  return Math.round(qibla);
}
