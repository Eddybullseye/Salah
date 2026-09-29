'use client';

import React, { useState } from 'react';
import {
  Flame,
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { MainPrayerName, PrayerLog, PrayerStatus, StreakStats } from '@/lib/types';

interface PrayerTrackerViewProps {
  logs: PrayerLog[];
  stats: StreakStats;
  onLogPrayer: (prayer: MainPrayerName, status: PrayerStatus, targetDate?: string) => void;
}

export const PrayerTrackerView: React.FC<PrayerTrackerViewProps> = ({
  logs,
  stats,
  onLogPrayer,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const mainPrayers: { name: MainPrayerName; title: string; arabic: string }[] = [
    { name: 'fajr', title: 'Fajr', arabic: 'الفجر' },
    { name: 'dhuhr', title: 'Dhuhr', arabic: 'الظهر' },
    { name: 'asr', title: 'Asr', arabic: 'العصر' },
    { name: 'maghrib', title: 'Maghrib', arabic: 'المغرب' },
    { name: 'isha', title: 'Isha', arabic: 'العشاء' },
  ];

  // Map logs for the selected date
  const selectedDateLogs = logs.filter((l) => l.date === selectedDate);
  const statusMap: Record<string, PrayerStatus> = {};
  selectedDateLogs.forEach((l) => {
    statusMap[l.prayer] = l.status;
  });

  // Calculate day completion
  const completedCountToday = Object.values(statusMap).filter(
    (s) => s === 'on_time' || s === 'late' || s === 'qada'
  ).length;

  // Handle previous / next date
  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Prepare 7-day data for weekly consistency chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const count = dayLogs.filter(
      (l) => l.status === 'on_time' || l.status === 'late' || l.status === 'qada'
    ).length;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    return { dateStr, dayLabel, count, isSelected: dateStr === selectedDate };
  });

  // Prepare 28-35 days for Monthly Calendar Heatmap
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const count = dayLogs.filter(
      (l) => l.status === 'on_time' || l.status === 'late' || l.status === 'qada'
    ).length;
    const isTodayCell = dateStr === new Date().toISOString().split('T')[0];
    return { dateStr, count, isTodayCell, dayNum: d.getDate() };
  });

  const getHeatmapColor = (count: number) => {
    switch (count) {
      case 5:
        return 'bg-amber-400 text-emerald-950 font-bold shadow-sm shadow-amber-400/40 ring-1 ring-amber-300';
      case 4:
        return 'bg-emerald-500 text-white font-medium';
      case 3:
        return 'bg-emerald-600/90 text-white';
      case 2:
        return 'bg-emerald-800 text-emerald-200';
      case 1:
        return 'bg-emerald-900 text-emerald-400';
      default:
        return 'bg-emerald-950/80 text-emerald-700/50 border border-emerald-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Streak and Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Streak */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/70 to-emerald-950/90 border border-emerald-800/60 shadow-md">
          <div className="flex items-center gap-2 text-amber-400">
            <Flame className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
              Current Streak
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">{stats.currentStreak}</span>
            <span className="text-xs text-amber-300/80 font-medium">days</span>
          </div>
          <p className="text-[11px] text-emerald-300/60 mt-0.5">Consecutive days praying</p>
        </div>

        {/* Best Streak */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/70 to-emerald-950/90 border border-emerald-800/60 shadow-md">
          <div className="flex items-center gap-2 text-amber-300">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
              Best Streak
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">{stats.bestStreak}</span>
            <span className="text-xs text-amber-300/80 font-medium">days</span>
          </div>
          <p className="text-[11px] text-emerald-300/60 mt-0.5">Personal record</p>
        </div>

        {/* 7-Day Consistency */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/70 to-emerald-950/90 border border-emerald-800/60 shadow-md">
          <div className="flex items-center gap-2 text-teal-300">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
              7-Day Rate
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-teal-300">
              {stats.completionRate7Days}%
            </span>
          </div>
          <p className="text-[11px] text-emerald-300/60 mt-0.5">Weekly completion</p>
        </div>

        {/* Total Prayers Logged */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/70 to-emerald-950/90 border border-emerald-800/60 shadow-md">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
              Total Prayed
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">{stats.totalPrayed}</span>
            <span className="text-xs text-emerald-300/80 font-medium">prayers</span>
          </div>
          <p className="text-[11px] text-emerald-300/60 mt-0.5">Logged in history</p>
        </div>
      </div>

      {/* Daily Prayer Log Checklist for Selected Date */}
      <div className="rounded-3xl bg-gradient-to-b from-emerald-950/90 to-teal-950/80 border border-amber-500/30 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Daily Prayer Tracker</h3>
              {isToday ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Today
                </span>
              ) : (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Return to Today
                </button>
              )}
            </div>
            <p className="text-xs text-emerald-200/70 mt-0.5">
              Completed {completedCountToday} of 5 prayers on{' '}
              <span className="font-semibold text-white">{selectedDate}</span>
            </p>
          </div>

          {/* Date Navigator Buttons */}
          <div className="flex items-center gap-1.5 bg-emerald-900/60 p-1 rounded-xl border border-emerald-700/50 self-start sm:self-auto">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-200 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-medium text-emerald-100">
              {selectedDate}
            </span>
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-200 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Prayers Checklist for Day */}
        <div className="mt-4 space-y-3">
          {mainPrayers.map((prayer) => {
            const currentStatus = statusMap[prayer.name];

            return (
              <div
                key={prayer.name}
                className="p-3.5 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-900/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      currentStatus === 'on_time'
                        ? 'bg-emerald-500 text-emerald-950'
                        : currentStatus === 'late'
                        ? 'bg-amber-500 text-emerald-950'
                        : currentStatus === 'qada'
                        ? 'bg-teal-500 text-emerald-950'
                        : currentStatus === 'missed'
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-900/70 text-emerald-300'
                    }`}
                  >
                    {currentStatus === 'on_time' ? '✓' : prayer.title.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{prayer.title}</span>
                      <span className="text-xs font-serif text-emerald-300/70">
                        {prayer.arabic}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-300/60 capitalize">
                      {currentStatus ? currentStatus.replace('_', ' ') : 'Not yet logged'}
                    </span>
                  </div>
                </div>

                {/* 4 Status Action Buttons */}
                <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center">
                  {(
                    [
                      { key: 'on_time', label: 'On Time', icon: CheckCircle2, activeClass: 'bg-emerald-500 text-emerald-950' },
                      { key: 'late', label: 'Late', icon: Clock, activeClass: 'bg-amber-500 text-emerald-950' },
                      { key: 'qada', label: 'Qada', icon: RotateCcw, activeClass: 'bg-teal-500 text-emerald-950' },
                      { key: 'missed', label: 'Missed', icon: AlertCircle, activeClass: 'bg-rose-500 text-white' },
                    ] as const
                  ).map((btn) => {
                    const Icon = btn.icon;
                    const isActive = currentStatus === btn.key;
                    return (
                      <button
                        key={btn.key}
                        onClick={() => onLogPrayer(prayer.name, btn.key, selectedDate)}
                        className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                          isActive
                            ? `${btn.activeClass} shadow-md`
                            : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/40'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consistency Heatmap & Weekly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Calendar Heatmap */}
        <div className="p-5 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">30-Day Prayer Heatmap</h4>
            </div>
            <span className="text-[11px] text-emerald-300/70">Tap cell to view day</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {calendarDays.map((cell) => {
              const isSelected = cell.dateStr === selectedDate;
              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-transform hover:scale-105 active:scale-95 ${getHeatmapColor(
                    cell.count
                  )} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-emerald-950 scale-105' : ''}`}
                  title={`${cell.dateStr}: ${cell.count}/5 prayers completed`}
                >
                  <span className="text-[10px] opacity-75">{cell.dayNum}</span>
                  <span className="text-xs font-bold">{cell.count}</span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-emerald-900/60 flex items-center justify-between text-[11px] text-emerald-300/80">
            <span>Less consistent</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-950 border border-emerald-900" title="0 prayers" />
              <div className="w-3 h-3 rounded bg-emerald-900" title="1 prayer" />
              <div className="w-3 h-3 rounded bg-emerald-800" title="2 prayers" />
              <div className="w-3 h-3 rounded bg-emerald-600" title="3 prayers" />
              <div className="w-3 h-3 rounded bg-emerald-500" title="4 prayers" />
              <div className="w-3 h-3 rounded bg-amber-400" title="5/5 prayers (Full)" />
            </div>
            <span>5/5 All Prayers</span>
          </div>
        </div>

        {/* 7-Day Bar Chart & Breakdown */}
        <div className="p-5 rounded-3xl bg-emerald-950/70 border border-emerald-800/50 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold text-white">Weekly Consistency</h4>
              </div>
              <span className="text-xs font-semibold text-teal-300">
                {stats.completionRate7Days}% Average
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2 px-2">
              {last7Days.map((day) => {
                const heightPercent = Math.max(10, (day.count / 5) * 100);
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end"
                    title={`${day.dateStr}: ${day.count} of 5`}
                  >
                    <span className="text-[10px] font-mono text-emerald-300/80 group-hover:text-white">
                      {day.count}
                    </span>
                    <div className="w-full max-w-[28px] bg-emerald-900/60 rounded-t-lg overflow-hidden flex items-end h-24">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          day.count === 5
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                            : day.count >= 3
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                            : 'bg-emerald-700/60'
                        } ${day.isSelected ? 'ring-2 ring-white' : ''}`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        day.isSelected ? 'text-amber-400 font-bold' : 'text-emerald-300/60'
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-emerald-900/60 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-900/40">
              <span className="text-emerald-400 font-bold block">{stats.onTimeCount}</span>
              <span className="text-[10px] text-emerald-300/70">On Time</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-900/40">
              <span className="text-amber-400 font-bold block">{stats.lateCount}</span>
              <span className="text-[10px] text-emerald-300/70">Late</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-900/40">
              <span className="text-teal-400 font-bold block">{stats.qadaCount}</span>
              <span className="text-[10px] text-emerald-300/70">Qada</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-900/40">
              <span className="text-rose-400 font-bold block">{stats.missedCount}</span>
              <span className="text-[10px] text-emerald-300/70">Missed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
