const CATEGORY_COLOR = {
  Explosive: 'border-ember',
  Summoning: 'border-toxic',
  Movement:  'border-ice',
  Time:      'border-violet',
  Transform: 'border-gold',
  Weather:   'border-ice',
  Mind:      'border-violet',
  Trap:      'border-ember',
  Buff:      'border-gold',
  Wild:      'border-pearl',
};

export default function RulePickModal({ payload, canPick, onPick }) {
  return (
    // Outer overlay scrolls when content exceeds viewport (small phones).
    // Inner wrapper centers content vertically when it fits.
    <div className="fixed inset-0 z-40 bg-night/90 backdrop-blur-sm slide-up overflow-y-auto overscroll-contain">
      <div className="min-h-full flex flex-col items-center justify-center px-3 py-4 md:p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-3 md:mb-4 sticky top-0 bg-night/80 backdrop-blur-sm py-2 -mx-3 px-3 md:static md:bg-transparent md:py-0 md:mx-0 md:px-0 z-10">
            <h2 className="font-pixel text-base md:text-xl text-gold">
              {canPick ? 'PICK A RULE' : `${payload.picker.toUpperCase()} IS PICKING...`}
            </h2>
            <p className="font-retro text-base md:text-lg text-pearl/70 mt-1">
              {canPick ? 'Choose one to inflict on the game.' : 'Watch and weep.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {payload.offerings.map((rule) => (
              <button
                key={rule.id}
                disabled={!canPick}
                onClick={() => onPick(rule.id)}
                className={`text-left card border-2 ${CATEGORY_COLOR[rule.category] || 'border-violet'} ${canPick ? 'active:scale-95 md:hover:scale-[1.02] md:hover:pulse-glow cursor-pointer' : 'opacity-70 cursor-not-allowed'} transition-all`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-pixel text-[10px] text-ice">#{rule.id} · {rule.category.toUpperCase()}</span>
                  <span className="font-pixel text-[9px] text-pearl/50">
                    {typeof rule.duration === 'number' ? `${rule.duration} TURNS` : String(rule.duration).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-pixel text-sm text-gold mt-2 leading-relaxed">{rule.name}</h3>
                <p className="font-retro text-base text-ember mt-1 italic">{rule.flavor}</p>
                <p className="font-retro text-base text-pearl/80 mt-2 leading-snug">{rule.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
