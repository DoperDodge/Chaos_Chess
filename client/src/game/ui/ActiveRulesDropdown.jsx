import { useEffect, useRef, useState } from 'react';
import { getRuleById } from '@chaotic-chess/shared/rules';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'expiring', label: 'Expiring soonest' },
  { id: 'category', label: 'By category' },
];

const CATEGORY_ICON = {
  Explosive: '💥', Summoning: '✨', Movement: '🏃', Time: '⏱️',
  Transform: '🔄', Weather: '🌩️', Mind: '🧠', Trap: '🪤',
  Buff: '🛡️', Wild: '🎲',
};

export default function ActiveRulesDropdown({ rules, myColor }) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState('newest');
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  const sorted = sortRules(rules || [], sort);
  const count = rules?.length || 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="glass rounded-full px-3 py-1.5 font-pixel text-[10px] flex items-center gap-2 hover:border-gold transition-colors"
      >
        <span className="text-ice">ACTIVE RULES</span>
        <span className={`px-1.5 rounded-full ${count ? 'bg-ember text-night' : 'bg-violet text-pearl'}`}>{count}</span>
        <span className="text-pearl/60">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 mt-1 w-80 max-h-[60vh] overflow-y-auto glass rounded-lg p-2 slide-up"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <select
              className="bg-night border border-violet rounded px-2 py-1 font-pixel text-[9px] text-pearl"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {count === 0 && <span className="font-retro text-base text-pearl/60">None active</span>}
          </div>
          <div className="space-y-1">
            {sorted.map((r) => {
              const meta = getRuleById(r.ruleId);
              if (!meta) return null;
              return <RuleEntry key={r.instanceId} instance={r} meta={meta} myColor={myColor} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RuleEntry({ instance, meta, myColor }) {
  const ownerChip = instance.owner === myColor ? 'YOU' : 'OPP';
  return (
    <div className="bg-night/70 border border-violet/40 rounded p-2 hover:border-gold transition-colors group relative">
      <div className="flex items-center gap-2">
        <span className="text-xl">{CATEGORY_ICON[meta.category] || '✦'}</span>
        <div className="flex-1 min-w-0">
          <div className="font-pixel text-[10px] text-pearl truncate">{meta.name}</div>
          <div className="font-retro text-sm text-pearl/60 truncate">{meta.flavor}</div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className={`font-pixel text-[8px] px-1 rounded ${instance.owner === 'white' ? 'bg-pearl text-night' : 'bg-night text-pearl border border-pearl'}`}>
            {ownerChip}
          </span>
          <span className="font-pixel text-[9px] text-ice mt-1">
            {instance.turnsRemaining != null ? `${instance.turnsRemaining}T` : (instance.durationKind === 'permanent' ? 'PERM' : 'TRIG')}
          </span>
        </div>
      </div>
      <div className="hidden group-hover:block absolute left-0 right-0 top-full mt-1 bg-night border border-gold rounded p-2 z-50 font-retro text-base text-pearl/90">
        {meta.desc}
      </div>
    </div>
  );
}

function sortRules(rules, mode) {
  const arr = [...rules];
  if (mode === 'newest') return arr.sort((a, b) => b.activatedAt - a.activatedAt);
  if (mode === 'expiring') return arr.sort((a, b) => (a.turnsRemaining ?? 999) - (b.turnsRemaining ?? 999));
  if (mode === 'category') {
    return arr.sort((a, b) => {
      const ca = getRuleById(a.ruleId)?.category || '';
      const cb = getRuleById(b.ruleId)?.category || '';
      return ca.localeCompare(cb);
    });
  }
  return arr;
}
