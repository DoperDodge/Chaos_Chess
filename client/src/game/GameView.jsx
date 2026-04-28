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
    case 'rule-activated': return `New rule: ${e.rule?.name || '?'}`;
    case 'rule-expired':   return `Rule expired`;
    case 'piece-killed':   return `Piece destroyed at ${e.square}`;
    case 'explosion':      return `BOOM at ${e.center}`;
    case 'game-over':      return `Game over: ${e.reason}`;
    case 'cluster-marked': return `Cluster bombs marked`;
    case 'pieces-spawned': return `Pieces summoned`;
    case 'lava-tiles':     return `Lava pools opened`;
    case 'walls-built':    return `Walls erected`;
    case 'piece-frozen':   return `Piece frozen at ${e.square}`;
    case 'lightning-strike': return `Lightning strikes ${e.square}!`;
    case 'apocalypse':     return `APOCALYPSE`;
    case 'coin-flip':      return `Coin flip: ${e.result}`;
    case 'rule-cancelled': return `A rule was cancelled`;
    case 'turn-skipped':   return `Turn skipped`;
    case 'extra-turn-active': return `Extra turn for ${e.color}`;
    case 'piece-defected': return `A piece switched sides!`;
    default: return e.type;
  }
}
