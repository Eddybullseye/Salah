'use client';

import React, { useState, useEffect } from 'react';
import { Compass, X, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { calculateQiblaBearing } from '@/lib/prayer-times';

interface QiblaCompassProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  cityName: string;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  cityName,
}) => {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isIOSDevice] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    );
  });

  const qiblaBearing = calculateQiblaBearing(latitude, longitude);

  useEffect(() => {
    if (!isOpen || isIOSDevice) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let compassHeading = e.alpha;

      // WebKit compass heading for iOS (absolute magnetic north)
      if ((e as any).webkitCompassHeading !== undefined) {
        compassHeading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Android standard: 360 - alpha
        compassHeading = 360 - e.alpha;
      }

      if (compassHeading !== null && compassHeading !== undefined) {
        setHeading(Math.round(compassHeading));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isOpen, isIOSDevice]);

  const requestIOSPermission = async () => {
    try {
      if (
        typeof (DeviceOrientationEvent as any) !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionStatus('granted');
          const handleOrientation = (e: DeviceOrientationEvent) => {
            let compassHeading = e.alpha;
            if ((e as any).webkitCompassHeading !== undefined) {
              compassHeading = (e as any).webkitCompassHeading;
            } else if (e.alpha !== null) {
              compassHeading = 360 - e.alpha;
            }
            if (compassHeading !== null && compassHeading !== undefined) {
              setHeading(Math.round(compassHeading));
            }
          };
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setPermissionStatus('denied');
        }
      }
    } catch (err) {
      console.warn('iOS orientation permission error:', err);
      setPermissionStatus('denied');
    }
  };

  if (!isOpen) return null;

  // The rotation for the compass dial
  const dialRotation = heading !== null ? -heading : 0;
  // Rotation for the Qibla needle relative to phone top
  const needleRotation = heading !== null ? (qiblaBearing - heading + 360) % 360 : qiblaBearing;
  const isAligned = heading !== null && Math.abs(heading - qiblaBearing) <= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-emerald-950 to-teal-950 border border-amber-500/40 p-6 shadow-2xl text-white text-center flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold">Qibla Direction</h3>
        </div>

        <p className="text-xs text-emerald-200/80 mb-5 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>{cityName || 'Your Location'}</span>
          <span className="opacity-60">•</span>
          <strong className="text-amber-300">{qiblaBearing}° from North</strong>
        </p>

        {/* iOS Permission Prompt */}
        {isIOSDevice && permissionStatus === 'prompt' ? (
          <div className="my-6 p-4 rounded-2xl bg-emerald-900/50 border border-emerald-700/50 text-xs space-y-3">
            <p className="text-emerald-100">
              iOS requires device motion permission to calibrate the live compass.
            </p>
            <button
              onClick={requestIOSPermission}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs shadow-md transition-colors"
            >
              Enable Compass Sensor
            </button>
          </div>
        ) : (
          /* Interactive Rotating Compass */
          <div className="relative w-64 h-64 my-4 flex items-center justify-center">
            {/* Outer Ring */}
            <div
              className="absolute inset-0 rounded-full border-4 border-emerald-700/60 shadow-2xl shadow-emerald-950/80 transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${dialRotation}deg)` }}
            >
              {/* Cardinal directions */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-amber-400">
                N
              </span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-300">
                E
              </span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold text-emerald-300">
                S
              </span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-300">
                W
              </span>

              {/* Angle ticks around edge */}
              <div className="absolute inset-4 rounded-full border border-dashed border-emerald-600/30" />
            </div>

            {/* Kaaba Direction Marker on Dial */}
            <div
              className="absolute inset-0 transition-transform duration-200 ease-out pointer-events-none"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-xl">🕋</span>
                <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-transparent rounded-full" />
              </div>
            </div>

            {/* Central Dial Hub */}
            <div
              className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center p-2 shadow-inner transition-colors ${
                isAligned
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-emerald-900/80 border-emerald-600/50 text-white'
              }`}
            >
              <span className="text-xl font-mono font-bold tracking-tight">
                {heading !== null ? `${heading}°` : '...'}
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-300/80 mt-0.5">
                {isAligned ? 'Aligned to Kaaba!' : 'Heading'}
              </span>
            </div>
          </div>
        )}

        {/* Alignment Status Banner */}
        <div
          className={`w-full p-2.5 rounded-xl text-xs font-medium transition-colors ${
            isAligned
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
              : 'bg-emerald-900/40 text-emerald-200/80'
          }`}
        >
          {isAligned
            ? '✓ Facing directly towards the Kaaba (Makkah)'
            : `Turn phone until the arrow aligns with the Kaaba (${qiblaBearing}°)`}
        </div>

        <p className="text-[11px] text-emerald-400/60 mt-3 italic">
          Hold device flat away from metallic objects for optimal accuracy.
        </p>
      </div>
    </div>
  );
};
