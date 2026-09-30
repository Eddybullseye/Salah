const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const screenshotsDir = path.join(publicDir, 'screenshots');
  const wellKnownDir = path.join(publicDir, '.well-known');

  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
  if (!fs.existsSync(wellKnownDir)) fs.mkdirSync(wellKnownDir, { recursive: true });

  // 1. Generate 96x96 Monochrome Notification Badge
  const badgeSvg = `
  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 12C32.536 12 20 24.536 20 40C20 55.464 32.536 68 48 68C58.824 68 68.22 61.88 72.84 53C60.52 53.64 49.36 43.8 49.36 31C49.36 23.4 53.36 16.64 59.32 12.8C55.76 12.28 52 12 48 12Z" fill="#FFFFFF"/>
    <polygon points="68,26 71,34 80,34 73,39 76,47 68,42 61,47 64,39 57,34 66,34" fill="#FFFFFF"/>
  </svg>`;
  await sharp(Buffer.from(badgeSvg))
    .png()
    .toFile(path.join(publicDir, 'icon-badge-96.png'));
  console.log('Created icon-badge-96.png');

  // 2. Generate Mobile Screenshot (540x960)
  const mobileSvg = `
  <svg width="540" height="960" viewBox="0 0 540 960" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="540" height="960" fill="#022c22"/>
    <!-- Top Bar -->
    <rect width="540" height="70" fill="#042f2e"/>
    <text x="24" y="44" fill="#f59e0b" font-family="sans-serif" font-weight="bold" font-size="20">🌙 Salah Companion</text>
    <text x="380" y="44" fill="#6ee7b7" font-family="sans-serif" font-size="14">Makkah (MWL)</text>
    
    <!-- Hero Prayer Card -->
    <rect x="20" y="90" width="500" height="230" rx="24" fill="#064e3b" stroke="#f59e0b" stroke-width="2"/>
    <rect x="40" y="110" width="160" height="30" rx="15" fill="#042f2e"/>
    <text x="56" y="130" fill="#a7f3d0" font-family="sans-serif" font-size="13">Current: Dhuhr</text>
    <text x="40" y="180" fill="#fbbf24" font-family="sans-serif" font-weight="bold" font-size="14">NEXT PRAYER</text>
    <text x="40" y="225" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="38">Asr</text>
    <text x="140" y="225" fill="#fcd34d" font-family="serif" font-size="28">العصر</text>
    <text x="240" y="225" fill="#6ee7b7" font-family="sans-serif" font-size="20">at 3:45 PM</text>
    <text x="360" y="280" fill="#fde68a" font-family="monospace" font-weight="bold" font-size="28">01:42:15</text>
    
    <!-- Prayer Times List -->
    <g transform="translate(20, 340)">
      <rect width="500" height="70" rx="16" fill="#042f2e" y="0"/>
      <text x="30" y="42" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="18">Fajr</text>
      <text x="380" y="42" fill="#a7f3d0" font-family="sans-serif" font-size="16">05:14 AM</text>
      
      <rect width="500" height="70" rx="16" fill="#042f2e" y="80"/>
      <text x="30" y="122" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="18">Sunrise</text>
      <text x="380" y="122" fill="#6ee7b7" font-family="sans-serif" font-size="16">06:28 AM</text>
      
      <rect width="500" height="70" rx="16" fill="#065f46" stroke="#f59e0b" stroke-width="1.5" y="160"/>
      <text x="30" y="202" fill="#fbbf24" font-family="sans-serif" font-weight="bold" font-size="18">Dhuhr</text>
      <text x="380" y="202" fill="#fde68a" font-family="sans-serif" font-weight="bold" font-size="16">12:18 PM</text>

      <rect width="500" height="70" rx="16" fill="#042f2e" y="240"/>
      <text x="30" y="282" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="18">Asr</text>
      <text x="380" y="282" fill="#a7f3d0" font-family="sans-serif" font-size="16">03:45 PM</text>

      <rect width="500" height="70" rx="16" fill="#042f2e" y="320"/>
      <text x="30" y="362" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="18">Maghrib</text>
      <text x="380" y="362" fill="#a7f3d0" font-family="sans-serif" font-size="16">06:08 PM</text>

      <rect width="500" height="70" rx="16" fill="#042f2e" y="400"/>
      <text x="30" y="442" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="18">Isha</text>
      <text x="380" y="442" fill="#a7f3d0" font-family="sans-serif" font-size="16">07:38 PM</text>
    </g>

    <!-- Bottom Tab Bar -->
    <rect y="880" width="540" height="80" fill="#042f2e"/>
    <text x="60" y="930" fill="#fbbf24" font-family="sans-serif" font-size="14">Home</text>
    <text x="180" y="930" fill="#6ee7b7" font-family="sans-serif" font-size="14">Tracker</text>
    <text x="310" y="930" fill="#6ee7b7" font-family="sans-serif" font-size="14">Learn</text>
    <text x="430" y="930" fill="#6ee7b7" font-family="sans-serif" font-size="14">Settings</text>
  </svg>`;
  await sharp(Buffer.from(mobileSvg))
    .png()
    .toFile(path.join(screenshotsDir, 'screenshot-phone.png'));
  console.log('Created screenshot-phone.png');

  // 3. Generate Tablet / Wide Screenshot (1280x720)
  const wideSvg = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#022c22"/>
    <!-- Top Header -->
    <rect width="1280" height="64" fill="#042f2e"/>
    <text x="40" y="40" fill="#f59e0b" font-family="sans-serif" font-weight="bold" font-size="22">🌙 Salah Companion</text>
    <text x="300" y="40" fill="#6ee7b7" font-family="sans-serif" font-size="15">Makkah, Saudi Arabia • MWL Method</text>
    <text x="1100" y="40" fill="#fbbf24" font-family="sans-serif" font-size="14">Qibla Compass | Tasbih</text>

    <!-- Left Column: Hero & Times -->
    <g transform="translate(40, 90)">
      <rect width="680" height="200" rx="20" fill="#064e3b" stroke="#f59e0b" stroke-width="2"/>
      <text x="30" y="50" fill="#a7f3d0" font-family="sans-serif" font-size="14">Current: Dhuhr</text>
      <text x="30" y="100" fill="#fbbf24" font-family="sans-serif" font-weight="bold" font-size="13">NEXT PRAYER</text>
      <text x="30" y="145" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="36">Asr (العصر) at 3:45 PM</text>
      <text x="480" y="145" fill="#fde68a" font-family="monospace" font-weight="bold" font-size="32">01:42:15</text>
    </g>

    <!-- Right Column: Tracker & Dhikr -->
    <g transform="translate(750, 90)">
      <rect width="490" height="200" rx="20" fill="#042f2e" stroke="#10b981" stroke-width="1"/>
      <text x="30" y="50" fill="#fbbf24" font-family="sans-serif" font-weight="bold" font-size="18">🔥 Prayer Consistency</text>
      <text x="30" y="90" fill="#ffffff" font-family="sans-serif" font-size="16">14-Day Streak • 100% on time this week</text>
      <text x="30" y="140" fill="#a7f3d0" font-family="serif" font-size="18">سُبْحَانَ اللَّهِ (SubhanAllah) • 33x</text>
    </g>

    <!-- Prayers Row -->
    <g transform="translate(40, 320)">
      <rect width="1200" height="340" rx="20" fill="#042f2e"/>
      <text x="40" y="50" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20">Today's Daily Salah Schedule</text>
      <text x="40" y="120" fill="#a7f3d0" font-family="sans-serif" font-size="16">Fajr: 05:14 AM</text>
      <text x="240" y="120" fill="#a7f3d0" font-family="sans-serif" font-size="16">Sunrise: 06:28 AM</text>
      <text x="440" y="120" fill="#fbbf24" font-family="sans-serif" font-weight="bold" font-size="16">Dhuhr: 12:18 PM</text>
      <text x="640" y="120" fill="#a7f3d0" font-family="sans-serif" font-size="16">Asr: 03:45 PM</text>
      <text x="840" y="120" fill="#a7f3d0" font-family="sans-serif" font-size="16">Maghrib: 06:08 PM</text>
      <text x="1040" y="120" fill="#a7f3d0" font-family="sans-serif" font-size="16">Isha: 07:38 PM</text>
    </g>
  </svg>`;
  await sharp(Buffer.from(wideSvg))
    .png()
    .toFile(path.join(screenshotsDir, 'screenshot-wide.png'));
  console.log('Created screenshot-wide.png');

  // 4. Generate assetlinks.json
  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "app.salahcompanion.twa",
        sha256_cert_fingerprints: [
          "14:6D:E9:D6:0F:4B:D7:2B:02:97:A2:20:2A:6F:8F:D0:A2:0A:7A:B4:73:96:40:99:99:65:24:D3:53:5A:F3:15"
        ]
      }
    }
  ];
  fs.writeFileSync(
    path.join(wellKnownDir, 'assetlinks.json'),
    JSON.stringify(assetlinks, null, 2)
  );
  console.log('Created assetlinks.json');

  // 5. Generate offline.html
  const offlineHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline • Salah Companion</title>
  <style>
    body {
      background-color: #022c22;
      color: #ecfdf5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #042f2e;
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 420px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 8px 0; color: #ffffff; }
    p { font-size: 14px; color: #a7f3d0; line-height: 1.5; margin: 0 0 24px 0; }
    .btn {
      background: linear-gradient(to right, #f59e0b, #d97706);
      color: #022c22;
      font-weight: bold;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      display: inline-block;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🌙</div>
    <h1>You are Currently Offline</h1>
    <p>Salah Companion calculates prayer times and plays adhan completely offline. Tap below to reload your saved dashboard.</p>
    <a href="/" class="btn">Reload Salah Companion</a>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(publicDir, 'offline.html'), offlineHtml);
  console.log('Created offline.html');
}

main().catch(console.error);
