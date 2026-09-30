'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { MosqueTimetableOverride } from '@/lib/types';
import {
  generateMosqueTimetableCSVTemplate,
  parseMosqueTimetableCSV,
} from '@/lib/prayer-times';

interface MosqueTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOverrides: MosqueTimetableOverride[];
  onSaveOverrides: (overrides: MosqueTimetableOverride[]) => void;
  onClearOverrides: () => void;
}

export const MosqueTimetableModal: React.FC<MosqueTimetableModalProps> = ({
  isOpen,
  onClose,
  currentOverrides,
  onSaveOverrides,
  onClearOverrides,
}) => {
  const [csvInput, setCsvInput] = useState<string>('');
  const [previewRecords, setPreviewRecords] = useState<MosqueTimetableOverride[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = generateMosqueTimetableCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'salah_mosque_timetable_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvInput(text);
      validateAndPreview(text);
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (text: string) => {
    const { valid, records, errors } = parseMosqueTimetableCSV(text);
    if (valid) {
      setPreviewRecords(records);
      setParseErrors([]);
    } else {
      setPreviewRecords(null);
      setParseErrors(errors);
    }
  };

  const handleApplyImport = () => {
    if (!previewRecords || previewRecords.length === 0) return;

    // Merge with existing overrides or replace
    const mergedMap = new Map<string, MosqueTimetableOverride>();
    currentOverrides.forEach((o) => mergedMap.set(o.date, o));
    previewRecords.forEach((o) => mergedMap.set(o.date, o));

    const finalRecords = Array.from(mergedMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    onSaveOverrides(finalRecords);
    setSuccessMessage(`Successfully imported ${previewRecords.length} timetable dates!`);
    setPreviewRecords(null);
    setCsvInput('');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in text-white">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-gradient-to-b from-emerald-950 via-teal-950 to-emerald-950 border border-amber-500/40 shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="p-5 sm:p-6 border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Import Mosque Monthly Timetable (CSV)
              </h2>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Exact prayer times from your local mosque schedule take 1st priority over auto-calculations.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Active Overrides Status Bar */}
          <div className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-white block">
                Active Imported Schedule:{' '}
                <strong className="text-amber-400">{currentOverrides.length} dates configured</strong>
              </span>
              <span className="text-[11px] text-emerald-300/70">
                {currentOverrides.length > 0
                  ? `From ${currentOverrides[0].date} to ${currentOverrides[currentOverrides.length - 1].date}`
                  : 'No mosque overrides active. The app calculates times mathematically.'}
              </span>
            </div>

            {currentOverrides.length > 0 && (
              <button
                onClick={onClearOverrides}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-700/50 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All Overrides</span>
              </button>
            )}
          </div>

          {/* Download Template & Upload Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download Template */}
            <div className="p-4 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex flex-col justify-between gap-3">
              <div>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>1. Download CSV Template</span>
                </span>
                <p className="text-[11px] text-emerald-300/70 mt-1 leading-relaxed">
                  Get a pre-formatted CSV template with columns: <code className="text-amber-300">date, fajr, sunrise, dhuhr, asr, maghrib, isha</code>.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download Template (.csv)</span>
              </button>
            </div>

            {/* Upload File */}
            <div className="p-4 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex flex-col justify-between gap-3">
              <div>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>2. Upload Timetable File</span>
                </span>
                <p className="text-[11px] text-emerald-300/70 mt-1 leading-relaxed">
                  Select your completed monthly timetable CSV file to validate and import.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Select CSV File</span>
              </button>
            </div>
          </div>

          {/* Paste Raw CSV Alternative */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-emerald-200">
                Or Paste CSV Content Directly:
              </label>
              <button
                onClick={() => validateAndPreview(csvInput)}
                disabled={!csvInput.trim()}
                className="text-amber-400 hover:text-white font-medium disabled:opacity-40"
              >
                Validate & Preview
              </button>
            </div>
            <textarea
              rows={4}
              value={csvInput}
              onChange={(e) => {
                setCsvInput(e.target.value);
                if (e.target.value.trim().length > 15) {
                  validateAndPreview(e.target.value);
                }
              }}
              placeholder="date,fajr,sunrise,dhuhr,asr,maghrib,isha&#10;2026-10-01,05:15,06:30,12:20,15:45,18:10,19:40"
              className="w-full p-3 rounded-2xl bg-emerald-900/40 border border-emerald-700/60 font-mono text-[11px] text-emerald-100 placeholder-emerald-500/60 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Error Message */}
          {parseErrors.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-700/60 text-red-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Validation Errors:</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-red-300">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-900/60 border border-emerald-600 text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Preview Table */}
          {previewRecords && previewRecords.length > 0 && (
            <div className="space-y-2 pt-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Ready to Import: {previewRecords.length} Rows Validated</span>
                </span>
                <span className="text-[11px] text-amber-300">Previewing first 5 dates</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-emerald-800/60">
                <table className="w-full text-center text-xs">
                  <thead className="bg-emerald-900/80 text-emerald-200 text-[11px] font-semibold border-b border-emerald-800">
                    <tr>
                      <th className="py-2 px-3 text-left">Date</th>
                      <th className="py-2 px-2">Fajr</th>
                      <th className="py-2 px-2">Sunrise</th>
                      <th className="py-2 px-2">Dhuhr</th>
                      <th className="py-2 px-2">Asr</th>
                      <th className="py-2 px-2">Maghrib</th>
                      <th className="py-2 px-2">Isha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/40 bg-emerald-950/70 font-mono text-[11px]">
                    {previewRecords.slice(0, 5).map((r, idx) => (
                      <tr key={idx} className="hover:bg-emerald-900/30">
                        <td className="py-2 px-3 text-left text-white font-sans font-medium">
                          {r.date}
                        </td>
                        <td className="py-2 px-2 text-amber-300">{r.fajr || '—'}</td>
                        <td className="py-2 px-2 text-emerald-300">{r.sunrise || '—'}</td>
                        <td className="py-2 px-2 text-amber-300">{r.dhuhr || '—'}</td>
                        <td className="py-2 px-2 text-amber-300">{r.asr || '—'}</td>
                        <td className="py-2 px-2 text-amber-300">{r.maghrib || '—'}</td>
                        <td className="py-2 px-2 text-amber-300">{r.isha || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleApplyImport}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all"
                >
                  Save & Apply Mosque Timetable ({previewRecords.length} Dates)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-emerald-950/90 border-t border-emerald-800/40 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
