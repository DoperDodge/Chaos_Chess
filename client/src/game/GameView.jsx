import { useEffect, useRef, useState, useMemo } from 'react';
import { useSocket } from '../shared/socket.jsx';
import { mountPhaser } from './phaser/mount.js';
import { getRuleById } from '@chaotic-chess/shared/rules';
import ActiveRulesDropdown from './ui/ActiveRulesDropdown.jsx';
import RulePickModal from './ui/RulePickModal.jsx';
import GameHUD from './ui/GameHUD.jsx';
import GameOverOverlay from './ui/GameOverOverlay.jsx';

export default function GameView({ initial, onLeave }) {
  const { socket } = useSocket();
  const phaserContainer = useRef(null);
  const phaserRef = useRef(null);
  const [state, setState] = useState(initial?.state);
  const [myColor] = useState(initial?.colors?.[socket.id] || null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [error, setError] = useState('');

  // Mount Phaser on first render
  useEffect(() => {
    if (!phaserContainer.current) return;
    phaserRef.current = mountPhaser(phaserContainer.current, {
      onMoveIntent: (from, to) => {
        socket.emit('game:move', { from, to, promotion: 'q' }, (resp) => {
          if (!resp?.ok) setError(resp?.error || 'illegal');
          else setError('');
        });
      },
    });
    return () => phaserRef.current?.destroy();
  }, []);

  // Push state into Phaser whenever it changes
  useEffect(() => {
    if (state && phaserRef.current) {
      phaserRef.current.updateState(state, myColor);
    }
  }, [state, myColor]);

  useEffect(() => {
    if (!socket) return;
    const onStateUpdate = ({ state: next, events }) => {
      setState(next);
      if (events?.length) {
        setRecentEvents((prev) => [...events, ...prev].slice(0, 30));
        if (phaserRef.current) phaserRef.current.playEvents(events);
      }
    };
    const onState = (s) => setState(s);
    socket.on('game:state', onStateUpdate);
    socket.on('game:state-snapshot', onState);
    // game:rule-pick still arrives but pendingPick on the state is the source
    // of truth — we ignore the legacy event so both clients stay in sync.
    return () => {
      socket.off('game:state', onStateUpdate);
      socket.off('game:state-snapshot', onState);
    };
  }, [socket]);

  // Modal payload derived from server-authoritative pendingPick. When the
  // server clears pendingPick (because the picker chose a rule), the modal
  // automatically closes for both players.
  const pickPayload = useMemo(() => {
    const pp = state?.pendingPick;
    if (!pp) return null;
    return {
      picker: pp.picker,
      offerings: (pp.offerings || []).map((id) => {
        const r = getRuleById(id);
        return r
          ? { id, name: r.name, category: r.category, duration: r.duration, flavor: r.flavor, desc: r.desc }
          : { id, name: `Rule ${id}`, category: 'Wild', duration: '?', flavor: '', desc: '' };
      }),
    };
  }, [state?.pendingPick]);

  const pickRule = (ruleId) => {
    socket.emit('game:pick-rule', { ruleId }, (resp) => {
      if (!resp?.ok) setError(resp?.error || 'pick failed');
      // No local close — when the server broadcasts the new state with
      // pendingPick: null, the modal closes for everyone.
    });
  };

  const resign = () => {
    if (confirm('Resign the game?')) socket.emit('game:resign');
  };

  if (!state) return <div className="p-8 text-center font-pixel text-gold">LOADING GAME...</div>;

  const canPick = !!pickPayload && myColor === pickPayload.picker;

  return (
    <div className="h-full flex flex-col">
      <GameHUD state={state} myColor={myColor} onResign={resign} onLeave={onLeave} />
      <div className="flex-1 relative overflow-hidden">
        <div ref={phaserContainer} className="absolute inset-0 flex items-center justify-center" />
        <div className="absolute top-4 right-4 z-20">
          <ActiveRulesDropdown rules={state.activeRules} myColor={myColor} />
        </div>
        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ember text-night font-pixel text-xs px-3 py-2 rounded shake">
            {error}
          </div>
        )}
        {recentEvents.length > 0 && (
          <div className="absolute bottom-4 left-4 max-w-xs space-y-1 pointer-events-none">
            {recentEvents.slice(0, 3).map((e, i) => (
              <div key={i} className="glass px-2 py-1 font-retro text-base text-pearl/80 rounded">
                {describeEvent(e)}
              </div>
            ))}
          </div>
        )}
      </div>

      {pickPayload && (
        <RulePickModal
          payload={pickPayload}
          canPick={canPick}
          onPick={pickRule}
        />
      )}

      {state.gameOver && (
        <GameOverOverlay result={state.gameOver} myColor={myColor} onLeave={onLeave} />
      )}
    </div>
  );
}

function describeEvent(e) {
  if (!e || !e.type) return '';
  switch (e.type) {
    case 'rule-activated':       return `New rule: ${e.rule?.name || '?'}`;
    case 'rule-expired':         return `Rule expired`;
    case 'rule-cancelled':       return `A rule was cancelled`;
    case 'piece-killed':         return `Piece destroyed at ${e.square}`;
    case 'piece-defected':       return `A piece switched sides!`;
    case 'piece-frozen':         return `Piece frozen at ${e.square}`;
    case 'piece-locked':         return `Piece locked at ${e.square}`;
    case 'piece-cursed':         return `Piece cursed at ${e.square}`;
    case 'piece-buffed':         return `Piece buffed (${e.kind || ''})`;
    case 'pieces-spawned':       return `Pieces summoned`;
    case 'explosion':            return `BOOM at ${e.center}`;
    case 'game-over':            return `Game over: ${e.reason}`;
    case 'cluster-marked':       return `Cluster bombs marked`;
    case 'mine-placed':          return `A mine was hidden`;
    case 'pit-placed':           return `A pit was dug`;
    case 'pit-triggered':        return `A piece fell into a pit`;
    case 'tripwire-set':         return `Tripwire armed`;
    case 'tripwire-triggered':   return `TRIPWIRE!`;
    case 'spike-warning':        return `Spike trap warning`;
    case 'spike-trap-triggered': return `Spikes!`;
    case 'lava-tiles':           return `Lava pools opened`;
    case 'lava-burn':            return `Burned by lava`;
    case 'walls-built':          return `Walls erected`;
    case 'pause-tile-set':       return `A tile is paused`;
    case 'cursed-square-set':    return `A square was cursed`;
    case 'lightning-strike':     return `Lightning strikes ${e.square}!`;
    case 'apocalypse':           return `APOCALYPSE`;
    case 'coin-flip':            return `Coin flip: ${e.result}`;
    case 'turn-skipped':         return `Turn skipped`;
    case 'extra-turn-active':    return `Extra turn for ${e.color}`;
    case 'mind-control':         return `Mind control: ${e.from} → ${e.to}`;
    case 'possession':           return `Possessed: ${e.from} → ${e.to}`;
    case 'confusion-applied':    return `Confused into ${e.from} → ${e.to}`;
    case 'mind-swap':            return `Mind Swap: ${e.a} ↔ ${e.b}`;
    case 'dream-walk':           return `King teleported`;
    case 'time-warp':            return `Time warped (${e.undone} moves undone)`;
    case 'fast-forward':         return `Fast forward!`;
    case 'groundhog-day':        return `Groundhog Day — replay`;
    case 'reverse-gravity':      return `Reverse gravity`;
    case 'mirror-flipped':       return `Board mirrored`;
    case 'hurricane':            return `Hurricane!`;
    case 'tsunami-warning':      return `Tsunami incoming`;
    case 'tsunami-wave':         return `Wave hits!`;
    case 'earthquake-shift':     return `Earthquake: ${e.from} → ${e.to}`;
    case 'magnetic-pull':        return `Magnetic pull at ${e.square}`;
    case 'black-hole-opened':    return `Black hole at ${e.square}`;
    case 'black-hole-devour':    return `Devoured by black hole`;
    case 'wormhole-set':         return `Wormhole opened`;
    case 'wormhole-traversed':   return `Wormhole: ${e.from} → ${e.to}`;
    case 'acid-pool':            return `Acid pool at ${e.square}`;
    case 'acid-tick':            return `Acid burns ${e.square} (HP ${e.hp})`;
    case 'plague-start':         return `Plague at ${e.square}`;
    case 'plague-spread':        return `Plague spreads ${e.from} → ${e.to}`;
    case 'royal-recruit-marked': return `Rook incoming at ${e.square}`;
    case 'doomsday-strike':      return `Doomsday strike at ${e.square}`;
    case 'cursed-strike':        return `Cursed Day strike at ${e.square}`;
    case 'roulette':             return `Russian roulette: ${e.victim}`;
    case 'lucky-protected':      return `Lucky shield at ${e.square}`;
    case 'iron-rook-saved':      return `Iron Rook survived a hit`;
    case 'iron-skin-saved':      return `Iron Skin saved a piece`;
    case 'vampire-feed':         return `Vampire bishop feeds — extra turn`;
    case 'heir-tagged':          return `Heir tagged at ${e.square}`;
    case 'heir-crowned':         return `Long live the king!`;
    case 'dragon-egg-laid':      return `Dragon egg at ${e.square}`;
    case 'skeleton-uprising':    return `Skeletons rise!`;
    case 'trojan-placed':        return `A trojan pawn appears`;
    case 'dance-step':           return `${e.color} king dances ${e.from} → ${e.to}`;
    case 'nuclear-warning':      return `NUCLEAR WARNING (${e.kind})`;
    case 'volcano-warning':      return `Volcano stirs`;
    case 'tar-pit-set':          return `Tar pit at ${e.square}`;
    case 'quicksand-tiles':      return `Quicksand opens`;
    case 'holy-ground-set':      return `Holy ground at ${e.square}`;
    case 'holy-resurrect':       return `Resurrected at ${e.square}!`;
    default: return e.type.replace(/-/g, ' ');
  }
}
