'use client';

import React from 'react';
import { X, Clock, BookOpen, Bookmark, Check, Share2 } from 'lucide-react';
import { IslamicStory } from '@/lib/types';

interface StoryDetailModalProps {
  story: IslamicStory | null;
  onClose: () => void;
  isBookmarked: boolean;
  isRead: boolean;
  onToggleBookmark: (id: string) => void;
  onToggleRead: (id: string) => void;
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({
  story,
  onClose,
  isBookmarked,
  isRead,
  onToggleBookmark,
  onToggleRead,
}) => {
  if (!story) return null;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: story.title,
        text: story.summary,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-gradient-to-b from-emerald-950 via-teal-950 to-emerald-950 border border-amber-500/40 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-800/40 bg-emerald-900/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
              {story.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(story.id)}
              className={`p-2 rounded-xl border transition-colors ${
                isBookmarked
                  ? 'bg-amber-500 text-emerald-950 border-amber-400'
                  : 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-800'
              }`}
              title={isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800 transition-colors"
              title="Share Story"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Story Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {story.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-emerald-300/80">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {story.read_time_minutes} min read
              </span>
              <span>•</span>
              <span className="text-amber-300/90 font-medium">Source: {story.source}</span>
            </div>
          </div>

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {story.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-900/50 text-emerald-200 border border-emerald-800/40"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Summary Callout */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border-l-4 border-l-amber-500 text-xs sm:text-sm text-emerald-100 italic leading-relaxed">
            {story.summary}
          </div>

          {/* Full Narrative Text */}
          <div className="prose prose-invert prose-emerald max-w-none text-slate-200 text-sm sm:text-base leading-relaxed space-y-4">
            {story.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Authentic Source Badge & Verification Notice */}
          <div className="mt-8 pt-4 border-t border-emerald-800/40 text-xs text-emerald-300/80 space-y-1">
            <p className="font-semibold text-amber-300">
              Authentic Reference: <span className="text-emerald-100 font-normal">{story.source}</span>
            </p>
            <p className="text-[11px] text-emerald-400/60 italic">
              Note: Every effort has been made to verify authentic classical references (Tafsir Ibn Kathir, Sahih al-Bukhari, Sahih Muslim, and Noble Quran). Please verify seeded content before publishing to custom domains.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-emerald-800/40 bg-emerald-950/80 flex items-center justify-between">
          <button
            onClick={() => onToggleRead(story.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isRead
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isRead ? 'Marked as Read ✓' : 'Mark as Read'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs shadow-md transition-colors"
          >
            Close Story
          </button>
        </div>
      </div>
    </div>
  );
};
