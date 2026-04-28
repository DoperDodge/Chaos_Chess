import { useEffect, useState } from 'react';
import { useSocket } from '../shared/socket.jsx';
import CreateLobbyModal from './CreateLobbyModal.jsx';

export default function LobbyHome({ onEnterLobby }) {
  const { socket } = useSocket();
  const [name, setName] = useState(() => localStorage.getItem('cc:name') || '');
  const [code, setCode] = useState('');
  const [lobbies, setLobbies] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem('cc:name', name); }, [name]);

  useEffect(() => {
    if (!socket) return;
    const fetchLobbies = async () => {
      try {
        const r = await fetch('/api/lobbies');
        const data = await r.json();
        setLobbies(data.lobbies || []);
      } catch (_) {}
    };
    fetchLobbies();
    socket.on('lobby:list-updated', fetchLobbies);
    const t = setInterval(fetchLobbies, 5000);
    return () => { socket.off('lobby:list-updated', fetchLobbies); clearInterval(t); };
  }, [socket]);

  const join = (joinCode) => {
    if (!name.trim()) return setError('Pick a name first.');
    setError('');
    socket.emit('lobby:join', { code: joinCode, name: name.trim() }, (resp) => {
      if (!resp?.ok) return setError(resp?.error || 'failed to join');
      onEnterLobby(resp.lobby);
    });
  };

  return (
    <div className="min-h-full flex flex-col items-center px-4 py-8 max-w-5xl mx-auto">
      <div className="text-center mb-8 slide-up">
        <h1 className="font-pixel text-3xl md:text-5xl text-gold drop-shadow-[0_0_20px_rgba(255,216,77,0.5)] mb-3">
          CHAOTIC CHESS
        </h1>
        <p className="font-retro text-xl md:text-2xl text-pearl/80">
          Bullet hell meets chess.com meets a Game Boy cartridge.
        </p>
      </div>

      <div className="card w-full max-w-md slide-up">
        <label className="block font-pixel text-xs text-ice mb-2">YOUR NAME</label>
        <input
          className="w-full bg-night border border-violet rounded px-3 py-2 font-retro text-xl text-pearl focus:outline-none focus:border-gold"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pawnstar"
        />
        <div className="flex gap-2 mt-4">
          <button className="btn btn-primary flex-1" onClick={() => setShowCreate(true)}>Create Lobby</button>
        </div>
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 bg-night border border-violet rounded px-3 py-2 font-pixel text-xs text-pearl uppercase tracking-widest focus:outline-none focus:border-gold"
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="6-CHAR CODE"
          />
          <button className="btn" onClick={() => join(code)}>Join</button>
        </div>
        {error && <div className="mt-3 text-ember font-retro text-lg">{error}</div>}
      </div>

      <div className="w-full max-w-3xl mt-10 slide-up">
        <h2 className="font-pixel text-sm text-ice mb-3">PUBLIC LOBBIES</h2>
        {lobbies.length === 0 ? (
          <div className="card text-center text-pearl/60 font-retro text-xl">No public lobbies yet. Be the first.</div>
        ) : (
          <div className="space-y-2">
            {lobbies.map((l) => (
              <div key={l.code} className="card flex items-center justify-between hover:border-gold transition-colors">
                <div>
                  <div className="font-pixel text-sm text-pearl">{l.name}</div>
                  <div className="font-retro text-base text-pearl/60">
                    Host: {l.hostName} · Interval: every {l.ruleSelectionInterval} turns · Clock: {l.timeControl ? `${l.timeControl}s` : 'unlimited'}
                  </div>
                </div>
                <button className="btn btn-gold" disabled={l.hasGuest} onClick={() => join(l.code)}>
                  {l.hasGuest ? 'Full' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateLobbyModal
          name={name}
          onClose={() => setShowCreate(false)}
          onCreated={(lobby) => { setShowCreate(false); onEnterLobby(lobby); }}
        />
      )}
    </div>
  );
}
