'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Heart,
  Bookmark,
  Sparkles,
  Search,
  Clock,
  CheckCircle,
  Copy,
  Check,
  Plus,
  Share2,
} from 'lucide-react';
import { DailyAyahHadith, DuaItem, IslamicStory } from '@/lib/types';
import { StoryDetailModal } from './StoryDetailModal';
import { AdminStoryModal } from './AdminStoryModal';

interface LearnIslamicContentViewProps {
  stories: IslamicStory[];
  duas: DuaItem[];
  dailyContent: DailyAyahHadith[];
  bookmarks: string[];
  readStories: string[];
  onToggleBookmark: (id: string) => void;
  onToggleReadStory: (id: string) => void;
  onAddStory: (story: IslamicStory) => void;
  isAdmin?: boolean;
}

export const LearnIslamicContentView: React.FC<LearnIslamicContentViewProps> = ({
  stories,
  duas,
  dailyContent,
  bookmarks,
  readStories,
  onToggleBookmark,
  onToggleReadStory,
  onAddStory,
  isAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<'stories' | 'duas' | 'daily' | 'bookmarks'>('stories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStory, setSelectedStory] = useState<IslamicStory | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyDua = (dua: DuaItem) => {
    const text = `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n"${dua.translation}"\n\nSource: ${dua.source}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(dua.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filtered stories
  const filteredStories = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered duas
  const filteredDuas = duas.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.transliteration.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Bookmarked items
  const bookmarkedStories = stories.filter((s) => bookmarks.includes(s.id));
  const bookmarkedDuas = duas.filter((d) => bookmarks.includes(d.id));
  const bookmarkedDaily = dailyContent.filter((c) => bookmarks.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/40 pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-emerald-950/80 border border-emerald-800/60">
          <button
            onClick={() => {
              setActiveTab('stories');
              setSelectedCategory('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'stories'
                ? 'bg-amber-500 text-emerald-950 shadow-md'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Stories ({stories.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('duas');
              setSelectedCategory('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'duas'
                ? 'bg-amber-500 text-emerald-950 shadow-md'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Duas ({duas.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('daily');
              setSelectedCategory('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-emerald-950 shadow-md'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Daily Quran & Hadith</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('bookmarks');
              setSelectedCategory('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'bookmarks'
                ? 'bg-amber-500 text-emerald-950 shadow-md'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({bookmarks.length})</span>
          </button>
        </div>

        {/* Admin Add Story Button */}
        {activeTab === 'stories' && (
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold shadow-md border border-emerald-600/50 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Story</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      {activeTab !== 'bookmarks' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'stories'
                  ? 'Search Prophet stories, themes, tags...'
                  : activeTab === 'duas'
                  ? 'Search supplications, translations...'
                  : 'Search daily verses & hadiths...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 text-xs text-white placeholder-emerald-400/50 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {activeTab === 'stories' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Stories' },
                { id: 'prophets', label: 'Prophets' },
                { id: 'companions', label: 'Sahabah' },
                { id: 'parables', label: 'Parables' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-800 text-amber-300 font-bold border border-amber-500/40'
                      : 'bg-emerald-900/40 text-emerald-300/80 hover:bg-emerald-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'duas' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Duas' },
                { id: 'prayer', label: 'Prayer' },
                { id: 'morning_evening', label: 'Morning/Evening' },
                { id: 'forgiveness', label: 'Forgiveness' },
                { id: 'daily', label: 'Daily Life' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-800 text-amber-300 font-bold border border-amber-500/40'
                      : 'bg-emerald-900/40 text-emerald-300/80 hover:bg-emerald-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: STORIES */}
      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStories.map((story) => {
            const isRead = readStories.includes(story.id);
            const isBookmarked = bookmarks.includes(story.id);

            return (
              <div
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-teal-950/90 border border-emerald-800/60 hover:border-amber-500/50 shadow-lg cursor-pointer transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {story.category}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {isRead && (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center gap-1 px-2 font-medium">
                        <Check className="w-3 h-3" /> Read
                      </span>
                    )}
                    <button
                      onClick={() => onToggleBookmark(story.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBookmarked
                          ? 'text-amber-400'
                          : 'text-emerald-400/60 hover:text-emerald-200'
                      }`}
                      title={isBookmarked ? 'Saved' : 'Bookmark'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white mt-2 group-hover:text-amber-300 transition-colors">
                  {story.title}
                </h3>

                <p className="text-xs text-emerald-200/70 mt-2 line-clamp-3 leading-relaxed">
                  {story.summary}
                </p>

                <div className="mt-4 pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-300/70">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {story.read_time_minutes} min read
                  </span>
                  <span className="text-amber-400 text-xs font-semibold group-hover:underline">
                    Read Story →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DUAS */}
      {activeTab === 'duas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDuas.map((dua) => {
            const isBookmarked = bookmarks.includes(dua.id);
            const isCopied = copiedId === dua.id;

            return (
              <div
                key={dua.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-teal-950/90 border border-emerald-800/60 shadow-lg flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-800/40 text-emerald-300">
                      {dua.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyDua(dua)}
                        className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 transition-colors"
                        title="Copy Dua"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => onToggleBookmark(dua.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'text-amber-400'
                            : 'text-emerald-400/60 hover:text-emerald-200'
                        }`}
                        title="Bookmark"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white mt-2">{dua.title}</h3>

                  {/* Arabic Calligraphy Display */}
                  <div className="my-3 p-3 rounded-xl bg-emerald-900/30 border border-emerald-800/40 text-right">
                    <p className="text-lg sm:text-xl font-serif text-amber-200 leading-loose">
                      {dua.arabic}
                    </p>
                  </div>

                  <p className="text-xs font-mono text-emerald-300/80 italic leading-relaxed">
                    {dua.transliteration}
                  </p>

                  <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                    &ldquo;{dua.translation}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-900/60 text-[11px] text-amber-400/90 font-medium">
                  Source: {dua.source}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: DAILY AYAH & HADITH */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {dailyContent.map((item) => {
            const isBookmarked = bookmarks.includes(item.id);

            return (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-950 border border-amber-500/30 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      {item.type === 'ayah' ? '📖' : '📜'}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {item.type === 'ayah' ? 'Verse of the Day' : 'Prophetic Hadith'}
                    </span>
                  </div>

                  <button
                    onClick={() => onToggleBookmark(item.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isBookmarked
                        ? 'text-amber-400'
                        : 'text-emerald-400/60 hover:text-emerald-200'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mt-2">{item.theme}</h3>

                <div className="my-4 p-4 rounded-2xl bg-emerald-900/30 border border-emerald-800/40 text-right">
                  <p className="text-xl sm:text-2xl font-serif text-amber-200 leading-loose">
                    {item.arabic}
                  </p>
                </div>

                <p className="text-sm text-slate-100 italic leading-relaxed">
                  &ldquo;{item.translation}&rdquo;
                </p>

                {item.reflection && (
                  <div className="mt-4 p-3 rounded-xl bg-teal-900/30 border-l-4 border-l-teal-500 text-xs text-emerald-200 leading-relaxed">
                    <strong className="text-teal-300 block mb-1">Reflection:</strong>
                    {item.reflection}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-emerald-900/60 text-xs font-semibold text-amber-300">
                  Source: {item.source}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarkedStories.length === 0 &&
          bookmarkedDuas.length === 0 &&
          bookmarkedDaily.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
              <Bookmark className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No bookmarks yet</p>
              <p className="text-xs text-emerald-300/60 mt-1">
                Tap the bookmark icon on any story, dua, or ayah to save it for quick reflection.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookmarkedStories.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-amber-400 mb-3 tracking-wider">
                    Saved Stories ({bookmarkedStories.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bookmarkedStories.map((story) => (
                      <div
                        key={story.id}
                        onClick={() => setSelectedStory(story)}
                        className="p-4 rounded-xl bg-emerald-900/40 border border-emerald-800 hover:border-amber-400/50 cursor-pointer"
                      >
                        <h5 className="font-bold text-sm text-white">{story.title}</h5>
                        <p className="text-xs text-emerald-200/70 line-clamp-2 mt-1">
                          {story.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookmarkedDuas.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-amber-400 mb-3 tracking-wider">
                    Saved Duas ({bookmarkedDuas.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bookmarkedDuas.map((dua) => (
                      <div
                        key={dua.id}
                        className="p-4 rounded-xl bg-emerald-900/40 border border-emerald-800"
                      >
                        <h5 className="font-bold text-sm text-white">{dua.title}</h5>
                        <p className="text-xs font-serif text-amber-200/90 mt-1 text-right">
                          {dua.arabic}
                        </p>
                        <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                          {dua.translation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reading Modal */}
      <StoryDetailModal
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
        isBookmarked={selectedStory ? bookmarks.includes(selectedStory.id) : false}
        isRead={selectedStory ? readStories.includes(selectedStory.id) : false}
        onToggleBookmark={onToggleBookmark}
        onToggleRead={onToggleReadStory}
      />

      {/* Admin Add Story Modal */}
      <AdminStoryModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSaveStory={onAddStory}
      />
    </div>
  );
};
