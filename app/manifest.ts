import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Salah Companion',
    short_name: 'Salah',
    description: 'Accurate offline prayer times, custom minute offsets, mosque timetable overrides, adhan audio, Qibla compass, and tasbih tracker.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#022c22',
    theme_color: '#042f2e',
    lang: 'en',
    categories: ['lifestyle', 'utilities', 'education'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-badge-96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'monochrome',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/screenshot-phone.png',
        sizes: '540x960',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Salah Companion Daily Prayer Schedule',
      },
      {
        src: '/screenshots/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Salah Companion Dashboard & Consistency Tracker',
      },
    ],
    shortcuts: [
      {
        name: 'Next prayer',
        short_name: 'Prayer',
        description: 'View time remaining until next prayer',
        url: '/',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Mark prayer done',
        short_name: 'Prayed',
        description: 'Log current prayer as completed on time',
        url: '/?action=quick_log',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Tasbih Counter',
        short_name: 'Tasbih',
        description: 'Open digital dhikr tasbih counter',
        url: '/?tab=tasbih',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
