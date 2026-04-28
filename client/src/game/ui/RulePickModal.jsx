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
    <div className="fixed inset-0 z-40 bg-night/85 backdrop-blur-sm flex items-end md:items-center justify-center p-4 slide-up">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-4">
          <h2 className="font-pixel text-xl text-gold">
            {canPick ? 'PICK A RULE' : `${payload.picker.toUpperCase()} IS PICKING...`}
          </h2>
          <p className="font-retro text-lg text-pearl/70 mt-1">
            {canPick ? 'Choose one to inflict on the game.' : 'Watch and weep.'}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {payload.offerings.map((rule) => (
            <button
              key={rule.id}
              disabled={!canPick}
              onClick={() => onPick(rule.id)}
              className={`text-left card border-2 ${CATEGORY_COLOR[rule.category] || 'border-violet'} ${canPick ? 'hover:scale-[1.02] hover:pulse-glow cursor-pointer' : 'opacity-70 cursor-not-allowed'} transition-all`}
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
  );
}
