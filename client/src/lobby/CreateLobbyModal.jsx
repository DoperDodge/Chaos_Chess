import { useState } from 'react';
import { useSocket } from '../shared/socket.jsx';
import { CATEGORIES, RULE_INTERVAL_OPTIONS, RULES_PER_PICK_OPTIONS, ACTIVE_RULE_CAP_OPTIONS, TIME_CONTROL_OPTIONS } from '@chaotic-chess/shared/constants';

export default function CreateLobbyModal({ name, onClose, onCreated }) {
  const { socket } = useSocket();
  const [lobbyName, setLobbyName] = useState(`${name || 'Player'}'s Chaos`);
  const [isPrivate, setPrivate] = useState(false);
  const [interval, setInterval] = useState(5);
  const [rulesPerPick, setRulesPerPick] = useState(3);
  const [activeCap, setActiveCap] = useState(10);
  const [timeControl, setTimeControl] = useState(60);
  const [startingColor, setStartingColor] = useState('random');
  const [spectators, setSpectators] = useState(true);
  const [categories, setCategories] = useState(new Set(Object.values(CATEGORIES)));
  const [error, setError] = useState('');

  const toggleCat = (c) => {
    const next = new Set(categories);
    next.has(c) ? next.delete(c) : next.add(c);
    setCategories(next);
  };

  const create = () => {
    if (!name?.trim()) return setError('Set your name on the home screen first.');
    socket.emit('lobby:create', {
      name,
      settings: {
        name: lobbyName,
        private: isPrivate,
        ruleSelectionInterval: interval,
        rulesPerPick,
        activeRuleCap: activeCap,
        timeControl,
        startingColor,
        spectatorsAllowed: spectators,
        ruleCategoryFilter: [...categories],
      },
    }, (resp) => {
      if (!resp?.ok) return setError(resp?.error || 'failed');
      onCreated(resp.lobby);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto slide-up">
        <h2 className="font-pixel text-xl text-gold mb-4">CREATE LOBBY</h2>

        <Field label="Lobby Name">
          <input className="input" value={lobbyName} onChange={(e) => setLobbyName(e.target.value)} maxLength={32} />
        </Field>

        <Field label="Visibility">
          <Toggle options={[['Public', false], ['Private', true]]} value={isPrivate} onChange={setPrivate} />
        </Field>

        <Field label="Rule Selection Interval (turns)">
          <Toggle options={RULE_INTERVAL_OPTIONS.map(n => [`${n}`, n])} value={interval} onChange={setInterval} />
        </Field>

        <Field label="Rules Per Pick">
          <Toggle options={RULES_PER_PICK_OPTIONS.map(n => [`${n}`, n])} value={rulesPerPick} onChange={setRulesPerPick} />
        </Field>

        <Field label="Active Rule Cap">
          <Toggle options={ACTIVE_RULE_CAP_OPTIONS.map(n => [n === 0 ? '∞' : `${n}`, n])} value={activeCap} onChange={setActiveCap} />
        </Field>

        <Field label="Time Control (per move)">
          <Toggle options={TIME_CONTROL_OPTIONS.map(n => [n === 0 ? 'Unlimited' : `${n}s`, n])} value={timeControl} onChange={setTimeControl} />
        </Field>

        <Field label="Starting Color">
          <Toggle options={[['Random', 'random'], ['White', 'white'], ['Black', 'black']]} value={startingColor} onChange={setStartingColor} />
        </Field>

        <Field label="Spectators Allowed">
          <Toggle options={[['Yes', true], ['No', false]]} value={spectators} onChange={setSpectators} />
        </Field>

        <Field label="Rule Categories">
          <div className="flex flex-wrap gap-2">
            {Object.values(CATEGORIES).map((c) => (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={`px-2 py-1 rounded font-pixel text-[10px] border transition ${categories.has(c) ? 'bg-violet border-gold text-pearl' : 'bg-night border-violet/40 text-pearl/40'}`}
              >{c}</button>
            ))}
          </div>
        </Field>

        {error && <div className="text-ember font-retro text-lg my-2">{error}</div>}

        <div className="flex gap-2 mt-4">
          <button className="btn flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={create}>Create</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <div className="font-pixel text-[10px] text-ice mb-1 uppercase">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([label, val]) => (
        <button
          key={String(val)}
          onClick={() => onChange(val)}
          className={`px-3 py-1 rounded font-pixel text-[10px] border transition ${value === val ? 'bg-gold text-night border-gold' : 'bg-night border-violet text-pearl hover:border-gold'}`}
        >{label}</button>
      ))}
    </div>
  );
}

// Util classes
// Tailwind apply for input
const _styles = document.createElement('style');
_styles.textContent = `.input{width:100%;background:#0d0a1f;border:1px solid #3a2670;border-radius:0.25rem;padding:0.5rem 0.75rem;font-family:VT323,monospace;font-size:1.25rem;color:#f0e8d8;outline:none}.input:focus{border-color:#ffd84d}`;
if (typeof document !== 'undefined' && !document.getElementById('cc-input-styles')) { _styles.id = 'cc-input-styles'; document.head.appendChild(_styles); }
