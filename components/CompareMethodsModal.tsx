'use client';

import React from 'react';
import { X, Check, Compass, Info, Sparkles } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { CALCULATION_METHODS, compareAllCalculationMethods } from '@/lib/prayer-times';

interface CompareMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSelectMethod: (methodId: string) => void;
}

export const CompareMethodsModal: React.FC<CompareMethodsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSelectMethod,
}) => {
  if (!isOpen) return null;

  const comparisonData = compareAllCalculationMethods(new Date(), profile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in text-white">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-gradient-to-b from-emerald-950 via-teal-950 to-emerald-950 border border-amber-500/40 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Compare Prayer Calculation Methods
              </h2>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Calculated for today at {profile.city_name || 'your location'} ({profile.latitude.toFixed(2)}°, {profile.longitude.toFixed(2)}°)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tip Box */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Compare the Fajr and Isha times below with your local mosque timetable or Islamic calendar to pick the exact matching calculation authority.
            </span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-emerald-800/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-900/80 text-emerald-200 uppercase tracking-wider text-[11px] font-semibold border-b border-emerald-800">
                <tr>
                  <th className="py-3 px-4">Authority & Formula</th>
                  <th className="py-3 px-3 text-center">Fajr</th>
                  <th className="py-3 px-3 text-center">Sunrise</th>
                  <th className="py-3 px-3 text-center">Dhuhr</th>
                  <th className="py-3 px-3 text-center">Asr</th>
                  <th className="py-3 px-3 text-center">Maghrib</th>
                  <th className="py-3 px-3 text-center">Isha</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/50 bg-emerald-950/60">
                {comparisonData.map((item) => {
                  const isCurrent = profile.calculation_method === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-emerald-900/40 transition-colors ${
                        isCurrent ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{item.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              Selected ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-300/70 mt-0.5 max-w-xs sm:max-w-md">
                          {item.description}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-amber-200">
                        {item.times.fajr}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-300/80">
                        {item.times.sunrise}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-amber-200">
                        {item.times.dhuhr}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-amber-200">
                        {item.times.asr}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-amber-200">
                        {item.times.maghrib}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-amber-200">
                        {item.times.isha}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold">
                            <Check className="w-4 h-4" /> Active
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectMethod(item.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-amber-500 hover:text-emerald-950 text-white font-semibold transition-all text-xs"
                          >
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-emerald-950/80 border-t border-emerald-800/40 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
