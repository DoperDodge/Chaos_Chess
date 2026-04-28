import { useEffect, useState } from 'react';
import { SocketProvider, useSocket } from './shared/socket.jsx';
import LobbyHome from './lobby/LobbyHome.jsx';
import LobbyRoom from './lobby/LobbyRoom.jsx';
import GameView from './game/GameView.jsx';

function Inner() {
  const { socket, connected } = useSocket();
  const [view, setView] = useState({ kind: 'home' });

  useEffect(() => {
    if (!socket) return;
    const onStart = (payload) => {
      setView({ kind: 'game', initial: payload });
    };
    const onClosed = () => {
      setView({ kind: 'home' });
    };
    socket.on('game:start', onStart);
    socket.on('lobby:closed', onClosed);
    return () => {
      socket.off('game:start', onStart);
      socket.off('lobby:closed', onClosed);
    };
  }, [socket]);

  if (!connected) {
    return (
      <div className="h-full flex items-center justify-center scanlines">
        <div className="font-pixel text-gold text-sm animate-pulse">CONNECTING...</div>
      </div>
    );
  }

  if (view.kind === 'home') return <LobbyHome onEnterLobby={(lobby) => setView({ kind: 'lobby', lobby })} />;
  if (view.kind === 'lobby') return <LobbyRoom lobby={view.lobby} onLeave={() => setView({ kind: 'home' })} />;
  if (view.kind === 'game') return <GameView initial={view.initial} onLeave={() => setView({ kind: 'home' })} />;
  return null;
}

export default function App() {
  return (
    <SocketProvider>
      <div className="h-full scanlines">
        <Inner />
      </div>
    </SocketProvider>
  );
}
