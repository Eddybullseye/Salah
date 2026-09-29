// Supabase Edge Function: send-prayer-reminders
// Triggered every minute via pg_cron + pg_net or manual webhook invocation.
// Deno TypeScript environment.

import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import * as adhan from 'npm:adhan@4.4.3';
import webpush from 'npm:web-push@3.6.7';

interface Profile {
  id: string;
  timezone: string;
  latitude: number;
  longitude: number;
  calculation_method: string;
  asr_method: string;
  adjustments: Record<string, number>;
  reminder_settings: {
    fajr?: { enabled: boolean; offset: number; nudge: number };
    dhuhr?: { enabled: boolean; offset: number; nudge: number };
    asr?: { enabled: boolean; offset: number; nudge: number };
    maghrib?: { enabled: boolean; offset: number; nudge: number };
    isha?: { enabled: boolean; offset: number; nudge: number };
    fajr_wakeup?: boolean;
    fajr_wakeup_offset?: number;
    ayah_of_day?: boolean;
    ayah_time?: string;
  };
}

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_label: string;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@salahcompanion.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

Deno.serve(async (req) => {
  // CORS check
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const summary = {
    evaluatedUsers: 0,
    notificationsSent: 0,
    subscriptionsPruned: 0,
    errors: [] as string[],
    timestamp: now.toISOString(),
  };

  try {
    // 1. Fetch profiles that have active push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth, device_label');

    if (subsError) throw subsError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No push subscriptions found', summary }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group subscriptions by user_id
    const subsByUser = new Map<string, PushSubscriptionRow[]>();
    for (const sub of subscriptions as PushSubscriptionRow[]) {
      if (!subsByUser.has(sub.user_id)) subsByUser.set(sub.user_id, []);
      subsByUser.get(sub.user_id)!.push(sub);
    }

    // 2. Fetch profiles for these users
    const userIds = Array.from(subsByUser.keys());
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profError) throw profError;
    if (!profiles) {
      return new Response(JSON.stringify({ message: 'No matching user profiles found', summary }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Helper: Map adhan calculation method
    function getCalculationParameters(methodName: string) {
      switch (methodName) {
        case 'Egyptian': return adhan.CalculationMethod.Egyptian();
        case 'Karachi': return adhan.CalculationMethod.Karachi();
        case 'UmmAlQura': return adhan.CalculationMethod.UmmAlQura();
        case 'Dubai': return adhan.CalculationMethod.Dubai();
        case 'Qatar': return adhan.CalculationMethod.Qatar();
        case 'Kuwait': return adhan.CalculationMethod.Kuwait();
        case 'MoonsightingCommittee': return adhan.CalculationMethod.MoonsightingCommittee();
        case 'NorthAmerica':
        case 'ISNA': return adhan.CalculationMethod.NorthAmerica();
        case 'MuslimWorldLeague':
        default: return adhan.CalculationMethod.MuslimWorldLeague();
      }
    }

    // Helper: Gentle reminder copy generator
    function getNotificationCopy(prayer: string, type: string) {
      const pName = prayer.charAt(0).toUpperCase() + prayer.slice(1);
      switch (type) {
        case 'fajr_wakeup':
          return {
            title: `Wake up for Fajr 🌅`,
            body: `Prayer is better than sleep. Arise and prepare for your meeting with Allah.`,
          };
        case 'before_30':
        case 'before_15':
        case 'before_10':
        case 'before_5': {
          const mins = type.replace('before_', '');
          return {
            title: `${pName} in ${mins} minutes`,
            body: `Prepare your wudu and clear a peaceful moment for ${pName} 🤍`,
          };
        }
        case 'nudge_15':
        case 'nudge_30':
          return {
            title: `Still haven't prayed ${pName}? 🤍`,
            body: `Take a short pause from the worldly rush to offer your ${pName} prayer.`,
          };
        case 'exact':
        default:
          return {
            title: `It's time for ${pName}`,
            body: `It's time for ${pName}. Take a moment for Allah 🤍`,
          };
      }
    }

    // 3. Process each user
    for (const profile of profiles as Profile[]) {
      summary.evaluatedUsers++;
      const userSubs = subsByUser.get(profile.id) || [];
      if (userSubs.length === 0) continue;

      const userTimezone = profile.timezone || 'UTC';
      // User local date string: YYYY-MM-DD
      const localDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      const coordinates = new adhan.Coordinates(profile.latitude, profile.longitude);
      const params = getCalculationParameters(profile.calculation_method);

      if (profile.asr_method === 'Hanafi') {
        params.madhab = adhan.Madhab.Hanafi;
      } else {
        params.madhab = adhan.Madhab.Shafi;
      }

      // Apply minute adjustments if configured
      const adj = profile.adjustments || {};
      if (adj.fajr) params.fajrAngle += 0; // or offset in milliseconds
      
      const prayerTimes = new adhan.PrayerTimes(coordinates, now, params);

      // Raw prayer Date objects
      const prayers: { name: string; time: Date; settings?: { enabled: boolean; offset: number; nudge: number } }[] = [
        { name: 'fajr', time: new Date(prayerTimes.fajr.getTime() + (adj.fajr || 0) * 60000), settings: profile.reminder_settings?.fajr },
        { name: 'dhuhr', time: new Date(prayerTimes.dhuhr.getTime() + (adj.dhuhr || 0) * 60000), settings: profile.reminder_settings?.dhuhr },
        { name: 'asr', time: new Date(prayerTimes.asr.getTime() + (adj.asr || 0) * 60000), settings: profile.reminder_settings?.asr },
        { name: 'maghrib', time: new Date(prayerTimes.maghrib.getTime() + (adj.maghrib || 0) * 60000), settings: profile.reminder_settings?.maghrib },
        { name: 'isha', time: new Date(prayerTimes.isha.getTime() + (adj.isha || 0) * 60000), settings: profile.reminder_settings?.isha },
      ];

      // Check Fajr Wakeup Reminder
      if (profile.reminder_settings?.fajr_wakeup) {
        const offsetMins = profile.reminder_settings.fajr_wakeup_offset || 20;
        const wakeupTime = new Date(prayers[0].time.getTime() - offsetMins * 60000);
        const diffMinutes = Math.round((now.getTime() - wakeupTime.getTime()) / 60000);

        if (diffMinutes === 0) {
          await dispatchNotification(supabase, profile.id, userSubs, 'fajr', localDateStr, 'fajr_wakeup', summary);
        }
      }

      // Check each prayer
      for (const p of prayers) {
        if (!p.settings || !p.settings.enabled) continue;

        const diffMinutes = Math.round((now.getTime() - p.time.getTime()) / 60000);

        // 1. Exact prayer time
        if (p.settings.offset === 0 && diffMinutes === 0) {
          await dispatchNotification(supabase, profile.id, userSubs, p.name, localDateStr, 'exact', summary);
        }

        // 2. Pre-prayer reminder (e.g. 5, 10, 15, 30 min before)
        if (p.settings.offset > 0 && diffMinutes === -p.settings.offset) {
          const typeKey = `before_${p.settings.offset}`;
          await dispatchNotification(supabase, profile.id, userSubs, p.name, localDateStr, typeKey, summary);
        }

        // 3. Follow-up nudge ("still haven't prayed?")
        if (p.settings.nudge > 0 && diffMinutes === p.settings.nudge) {
          // Check if already marked as prayed today
          const { data: logged } = await supabase
            .from('prayer_logs')
            .select('status')
            .eq('user_id', profile.id)
            .eq('date', localDateStr)
            .eq('prayer', p.name)
            .maybeSingle();

          if (!logged) {
            const typeKey = `nudge_${p.settings.nudge}`;
            await dispatchNotification(supabase, profile.id, userSubs, p.name, localDateStr, typeKey, summary);
          }
        }
      }
    }

    return new Response(JSON.stringify({ status: 'success', summary }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    summary.errors.push(err.message || String(err));
    return new Response(JSON.stringify({ status: 'error', error: err.message, summary }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function dispatchNotification(
  supabase: any,
  userId: string,
  subscriptions: PushSubscriptionRow[],
  prayer: string,
  dateStr: string,
  type: string,
  summary: any
) {
  // Check deduplication in notification_log
  const { data: existingLog } = await supabase
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('prayer', prayer)
    .eq('date', dateStr)
    .eq('type', type)
    .maybeSingle();

  if (existingLog) {
    // Already notified for this prayer, date, and reminder type
    return;
  }

  // Record in notification_log first to lock against race conditions
  const { error: insertLogError } = await supabase
    .from('notification_log')
    .insert({
      user_id: userId,
      prayer,
      date: dateStr,
      type,
    });

  if (insertLogError) {
    // Unique constraint violation or failure -> skip
    return;
  }

  const copy = getNotificationCopy(prayer, type);
  const payload = JSON.stringify({
    title: copy.title,
    body: copy.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `salah-${prayer}-${dateStr}-${type}`,
    data: {
      url: `/?tab=home&prayer=${prayer}&date=${dateStr}`,
      prayer,
      date: dateStr,
      type,
    },
    actions: [
      { action: 'mark_prayed', title: '✓ I prayed' },
      { action: 'snooze_10', title: '⏰ Remind in 10m' },
    ],
  });

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, payload);
      summary.notificationsSent++;
    } catch (pushErr: any) {
      // Handle expired or unregistered endpoints (404 Not Found or 410 Gone)
      if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
        console.log(`[Push] Pruning expired subscription: ${sub.id} (${sub.device_label})`);
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        summary.subscriptionsPruned++;
      } else {
        console.warn(`[Push Error] for sub ${sub.id}:`, pushErr.message);
        summary.errors.push(`Sub ${sub.id}: ${pushErr.message}`);
      }
    }
  }
}

function getNotificationCopy(prayer: string, type: string) {
  const pName = prayer.charAt(0).toUpperCase() + prayer.slice(1);
  if (type === 'fajr_wakeup') {
    return {
      title: `Wake up for Fajr 🌅`,
      body: `Prayer is better than sleep. Arise and prepare for your meeting with Allah.`,
    };
  }
  if (type.startsWith('before_')) {
    const mins = type.replace('before_', '');
    return {
      title: `${pName} in ${mins} minutes`,
      body: `Prepare your wudu and clear a peaceful moment for ${pName} 🤍`,
    };
  }
  if (type.startsWith('nudge_')) {
    return {
      title: `Still haven't prayed ${pName}? 🤍`,
      body: `Take a short pause from the worldly rush to offer your ${pName} prayer.`,
    };
  }
  return {
    title: `It's time for ${pName}`,
    body: `It's time for ${pName}. Take a moment for Allah 🤍`,
  };
}
