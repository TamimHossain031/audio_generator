import React from 'react';
import { Mic, Search } from 'lucide-react';

export interface VoicePickerItem {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  subtitle: string;
  tag?: string;
  tierBadge?: 'free' | 'paid';
  recommended?: boolean;
}

interface Props {
  items: VoicePickerItem[];
  selectedId: string;
  onSelect: (item: VoicePickerItem) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  genderFilter: 'all' | 'male' | 'female';
  onGenderFilterChange: (g: 'all' | 'male' | 'female') => void;
  searchPlaceholder?: string;
  maxHeightClass?: string;
}

export const VoicePickerGrid: React.FC<Props> = ({
  items,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  genderFilter,
  onGenderFilterChange,
  searchPlaceholder = 'Search voice name, tone, or style...',
  maxHeightClass = 'max-h-64',
}) => {
  const q = searchQuery.trim().toLowerCase();

  const matchesSearch = (item: VoicePickerItem) => {
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      (item.tag || '').toLowerCase().includes(q) ||
      item.gender.includes(q)
    );
  };

  const searchedItems = items.filter(matchesSearch);
  const maleItems = searchedItems.filter((i) => i.gender === 'male');
  const femaleItems = searchedItems.filter((i) => i.gender === 'female');
  const neutralItems = searchedItems.filter((i) => i.gender === 'neutral');

  const totalMale = items.filter((i) => i.gender === 'male').length;
  const totalFemale = items.filter((i) => i.gender === 'female').length;

  const renderCard = (item: VoicePickerItem) => {
    const isSelected = selectedId === item.id;
    const isMale = item.gender === 'male';
    const isFemale = item.gender === 'female';

    const selectedStyle = isFemale
      ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 shadow-md shadow-rose-500/10'
      : isMale
      ? 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-500 shadow-md shadow-sky-500/10'
      : 'bg-violet-500/15 border-violet-500 ring-1 ring-violet-500 shadow-md';

    const defaultStyle =
      'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900';

    const iconColor = isFemale
      ? 'text-rose-400'
      : isMale
      ? 'text-sky-400'
      : 'text-violet-400';

    const genderBadgeClass = isFemale
      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
      : isMale
      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
      : 'bg-violet-500/15 text-violet-300 border border-violet-500/30';

    const genderLabel = isFemale ? '♀ Female' : isMale ? '♂ Male' : '◎ Neutral';

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(item)}
        className={`text-left p-2.5 rounded-xl border transition-all ${
          isSelected ? selectedStyle : defaultStyle
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Mic className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
            <span className="font-semibold text-xs text-slate-100 font-mono truncate">
              {item.name}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {item.tierBadge === 'paid' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Paid
              </span>
            )}
            {item.tierBadge === 'free' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                Free OK
              </span>
            )}
            {item.tag && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {item.tag}
              </span>
            )}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${genderBadgeClass}`}
            >
              {genderLabel}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
      </button>
    );
  };

  const showMale = genderFilter === 'all' || genderFilter === 'male';
  const showFemale = genderFilter === 'all' || genderFilter === 'female';
  const showNeutral = genderFilter === 'all' && neutralItems.length > 0;
  const visibleCount =
    (showMale ? maleItems.length : 0) +
    (showFemale ? femaleItems.length : 0) +
    (showNeutral ? neutralItems.length : 0);

  return (
    <div className="space-y-2.5">
      {/* Search & Prominent Color-Coded Gender Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => onGenderFilterChange('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              genderFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => onGenderFilterChange('male')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
              genderFilter === 'male'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-sky-300/80 hover:text-sky-200 hover:bg-sky-500/10'
            }`}
          >
            <span>♂ Male ({totalMale})</span>
          </button>
          <button
            type="button"
            onClick={() => onGenderFilterChange('female')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
              genderFilter === 'female'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-300/80 hover:text-rose-200 hover:bg-rose-500/10'
            }`}
          >
            <span>♀ Female ({totalFemale})</span>
          </button>
        </div>
      </div>

      {/* Separated Male / Female Sections — Never Mixed Together */}
      <div
        className={`${maxHeightClass} overflow-y-auto p-2.5 border border-slate-800 rounded-xl bg-slate-950/60 space-y-4`}
      >
        {visibleCount === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">
            No matching voices found. Try clearing your search or switching the gender filter.
          </p>
        ) : (
          <>
            {showMale && maleItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                    <span>♂</span>
                    <span>Male Voices</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-sky-300/90">
                    {maleItems.length} {maleItems.length === 1 ? 'voice' : 'voices'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {maleItems.map(renderCard)}
                </div>
              </div>
            )}

            {showFemale && femaleItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <span>♀</span>
                    <span>Female Voices</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-rose-300/90">
                    {femaleItems.length} {femaleItems.length === 1 ? 'voice' : 'voices'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {femaleItems.map(renderCard)}
                </div>
              </div>
            )}

            {showNeutral && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/25">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                    <span>◎</span>
                    <span>Neutral Voices</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-violet-300/90">
                    {neutralItems.length} {neutralItems.length === 1 ? 'voice' : 'voices'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {neutralItems.map(renderCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
