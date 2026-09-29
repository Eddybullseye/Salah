import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(req: NextRequest) {
  try {
    const { subscription, vapidKeys } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Push subscription endpoint is missing.' },
        { status: 400 }
      );
    }

    const publicKey = vapidKeys?.publicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = vapidKeys?.privateKey || process.env.VAPID_PRIVATE_KEY;
    const subject = vapidKeys?.subject || process.env.VAPID_SUBJECT || 'mailto:support@salahcompanion.app';

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: 'VAPID public and private keys must be configured.' },
        { status: 400 }
      );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title: "It's time for Asr 🤍",
      body: 'Take a moment for Allah. Your 1-minute test reminder was delivered successfully!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-push-' + Date.now(),
      actions: [
        { action: 'mark_prayed', title: '✓ I prayed' },
        { action: 'snooze_10', title: '⏰ Remind in 10m' },
      ],
      data: {
        url: '/?tab=home&prayer=asr&test=verified',
        prayer: 'asr',
        date: new Date().toISOString().split('T')[0],
      },
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({
      success: true,
      message: 'Test push notification dispatched successfully!',
    });
  } catch (err: any) {
    console.error('API Send Push Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch push notification.' },
      { status: 500 }
    );
  }
}
