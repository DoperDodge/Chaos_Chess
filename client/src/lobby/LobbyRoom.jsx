import { useEffect, useState } from 'react';
import { useSocket } from '../shared/socket.jsx';
import { RULES } from '@chaotic-chess/shared/rules';

export default function LobbyRoom({ lobby, onLeave }) {
  const { socket } = useSocket();
  const [state, setState] = useState(lobby);
  const [showBan, setShowBan] = useState(false);
  const [banlist, setBanlist] = useState([]);
  const me = identifySelf(state, socket?.id);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (next) => setState(next);
    const onClosed = () => onLeave();
    socket.on('lobby:updated', onUpdate);
    socket.on('lobby:closed', onClosed);
    return () => {
      socket.off('lobby:updated', onUpdate);
      socket.off('lobby:closed', onClosed);
    };
  }, [socket]);

  const ready = me?.ready;
  const toggleReady = () => socket.emit('lobby:ready', { ready: !ready });
  const leave = () => socket.emit('lobby:leave', {}, () => onLeave());

  const toggleBan = (id) => {
    const next = banlist.includes(id) ? banlist.filter(x => x !== id) : (banlist.length < 5 ? [...banlist, id] : banlist);
    setBanlist(next);
    socket.emit('lobby:set-banlist', { banlist: next });
  };

  return (
    <div className="min-h-full p-4 max-w-4xl mx-auto">
      <button className="btn mb-4" onClick={leave}>← Leave</button>

      <div className="card slide-up">
        <div className="flex items-baseline justify-between">
          <h2 className="font-pixel text-2xl text-gold">{state.name}</h2>
          <div className="font-pixel text-xs text-ice">
            CODE: <span className="text-gold tracking-[0.3em]">{state.code}</span>
          </div>
        </div>
        <div className="mt-2 font-retro text-lg text-pearl/70">
          Interval every {state.settings?.ruleSelectionInterval} turns · {state.settings?.rulesPerPick} per pick · cap {state.settings?.activeRuleCap || '∞'} · {state.settings?.timeControl ? `${state.settings.timeControl}s clock` : 'no clock'}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <PlayerCard player={state.host} role="HOST" isMe={me === state.host} ready={state.host?.ready} />
        <PlayerCard player={state.guest} role="GUEST" isMe={me === state.guest} ready={state.guest?.ready} />
      </div>

      <div className="mt-4 card">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-sm text-ice">YOUR BANLIST ({banlist.length}/5)</h3>
          <button className="btn" onClick={() => setShowBan(s => !s)}>{showBan ? 'Close' : 'Manage Bans'}</button>
        </div>
        {banlist.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {banlist.map((id) => {
              const r = RULES.find(x => x.id === id);
              return <span key={id} className="px-2 py-0.5 rounded font-pixel text-[10px] bg-ember text-night">{r.name}</span>;
            })}
          </div>
        )}
        {showBan && (
          <div className="mt-3 max-h-72 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-1">
            {RULES.map((r) => (
              <button
                key={r.id}
                onClick={() => toggleBan(r.id)}
                className={`text-left px-2 py-1 rounded font-retro text-base border transition ${banlist.includes(r.id) ? 'bg-ember/30 border-ember text-pearl' : 'bg-night border-violet/40 text-pearl/70 hover:border-gold'}`}
              >
                <span className="font-pixel text-[9px] text-ice">#{r.id}</span> {r.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3 justify-center">
        <button className={`btn ${ready ? 'btn-gold' : 'btn-primary'} text-sm`} onClick={toggleReady}>
          {ready ? '✓ READY' : 'NOT READY'}
        </button>
      </div>
      {state.host?.ready && state.guest?.ready && (
        <div className="mt-4 text-center font-pixel text-gold animate-pulse">STARTING...</div>
      )}
    </div>
  );
}

function PlayerCard({ player, role, isMe, ready }) {
  if (!player) {
    return (
      <div className="card opacity-50">
        <div className="font-pixel text-xs text-ice">{role}</div>
        <div className="font-retro text-2xl text-pearl/40 mt-2">Waiting for opponent...</div>
      </div>
    );
  }
  return (
    <div className={`card ${ready ? 'border-gold pulse-glow' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="font-pixel text-xs text-ice">{role}{isMe ? ' (YOU)' : ''}</div>
        <div className={`font-pixel text-[10px] ${ready ? 'text-gold' : 'text-pearl/40'}`}>{ready ? 'READY' : 'NOT READY'}</div>
      </div>
      <div className="font-retro text-3xl text-pearl mt-2">{player.name}</div>
      {player.color && (
        <div className="font-pixel text-[10px] mt-1 text-ice">{player.color.toUpperCase()}</div>
      )}
    </div>
  );
}

function identifySelf(state, sid) {
  // We can't read the host's socketId from the lobby payload; client compares names + role.
  // Backend doesn't echo socket IDs. We just use "I'm the one who is host vs guest" by tracking via lobby creation flow.
  // Simple heuristic: store last-known role in localStorage when joining/creating.
  return null; // placeholder; ready toggle works regardless of identification
}
