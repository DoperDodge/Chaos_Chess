import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const Ctx = createContext(null);

export function SocketProvider({ children }) {
  const socket = useMemo(() => io({ autoConnect: true, transports: ['websocket', 'polling'] }), []);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, [socket]);
  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSocket() {
  return useContext(Ctx);
}
