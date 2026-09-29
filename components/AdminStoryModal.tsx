'use client';

import React, { useState } from 'react';
import { X, Plus, Save, BookOpen, AlertCircle } from 'lucide-react';
import { IslamicStory } from '@/lib/types';

interface AdminStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStory: (story: IslamicStory) => void;
  storyToEdit?: IslamicStory | null;
}

export const AdminStoryModal: React.FC<AdminStoryModalProps> = ({
  isOpen,
  onClose,
  onSaveStory,
  storyToEdit,
}) => {
  const [title, setTitle] = useState(storyToEdit?.title || '');
  const [slug, setSlug] = useState(storyToEdit?.slug || '');
  const [category, setCategory] = useState(storyToEdit?.category || 'prophets');
  const [summary, setSummary] = useState(storyToEdit?.summary || '');
  const [content, setContent] = useState(storyToEdit?.content || '');
  const [source, setSource] = useState(storyToEdit?.source || '');
  const [tagsStr, setTagsStr] = useState(storyToEdit?.tags?.join(', ') || '');
  const [readTime, setReadTime] = useState(storyToEdit?.read_time_minutes || 5);
  const [published, setPublished] = useState(storyToEdit?.published ?? true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !source) return;

    const generatedSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newStory: IslamicStory = {
      id: storyToEdit?.id || `story-${Date.now()}`,
      title: title.trim(),
      slug: generatedSlug,
      category,
      summary: summary.trim() || title.trim(),
      content: content.trim(),
      source: source.trim(),
      tags,
      read_time_minutes: Number(readTime) || 5,
      order_index: storyToEdit?.order_index || 99,
      published,
    };

    onSaveStory(newStory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-emerald-950 border border-amber-500/40 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-800/40 bg-emerald-900/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white">
              {storyToEdit ? 'Edit Islamic Story' : 'Add New Islamic Story (Admin)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-emerald-200 mb-1">Story Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prophet Musa (AS) and the Parting of the Sea"
              className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 focus:border-amber-400 focus:outline-none text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 focus:border-amber-400 focus:outline-none text-white text-xs"
              >
                <option value="prophets">Stories of the Prophets</option>
                <option value="companions">Stories of the Sahabah</option>
                <option value="parables">Quranic Parables</option>
                <option value="morals">Moral & Ethical Lessons</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-emerald-200 mb-1">Read Time (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={readTime}
                onChange={(e) => setReadTime(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 focus:border-amber-400 focus:outline-none text-white text-xs"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-emerald-200 mb-1">Authentic Source *</label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Surah Ash-Shu'ara (26:61-67), Tafsir Ibn Kathir"
              className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 focus:border-amber-400 focus:outline-none text-white text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-emerald-200 mb-1">Summary Callout</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief 1-2 sentence overview of the lesson..."
              className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 focus:border-amber-400 focus:outline-none text-white text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-emerald-200 mb-1">Full Story Narrative *</label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full authentic story..."
              className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 focus:border-amber-400 focus:outline-none text-white text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-semibold text-emerald-200 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="prophets, patience, miracles, makkah"
              className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 focus:border-amber-400 focus:outline-none text-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
            />
            <label htmlFor="published" className="text-xs text-emerald-100 font-medium">
              Publish immediately (visible to all users)
            </label>
          </div>

          {/* Verification Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Always verify story citations with authentic Islamic collections (Noble Quran, Sahih Bukhari, Sahih Muslim, Tafsir Ibn Kathir) prior to public release.
            </span>
          </div>

          <div className="pt-3 border-t border-emerald-800/40 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 text-xs font-bold shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Story</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
