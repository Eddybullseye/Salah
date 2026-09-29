import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#042f2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Salah Companion - Prayer Times & Tracker',
  description:
    'Production-ready Progressive Web App to remember and track daily prayers with push reminders, Qibla compass, tasbih, and Islamic stories.',
  applicationName: 'Salah Companion',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Salah',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Salah Companion - Prayer Times & Tracker',
    description:
      'Timely prayer notifications, streak tracking, Qibla compass, and authentic Islamic content.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salah Companion - Prayer Times & Tracker',
    description:
      'Timely prayer notifications, streak tracking, Qibla compass, and authentic Islamic content.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-emerald-950 text-slate-100 min-h-screen selection:bg-amber-500 selection:text-emerald-950 font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
