import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Socket } from "socket.io-client";
import { SocketManager, SocketManagerOptions } from "./SocketManager";
import type { WsEventMap, WsEventName } from "./socket-events";

type Ctx = {
  socket: Socket | null;
  connected: boolean;
  manager: SocketManager | null;
  refreshAuth: () => Promise<void>;
};
const SocketCtx = createContext<Ctx>({
  socket: null,
  connected: false,
  manager: null,
  refreshAuth: async () => {},
});
export const useSocketCtx = () => useContext(SocketCtx);

// Provider configurable (útil en tests / SSR)
type Props = Omit<SocketManagerOptions, "getToken"> & {
  children: React.ReactNode;
  getToken: SocketManagerOptions["getToken"];
};

export function SocketProvider({ children, ...opts }: Props) {
  const manager = useMemo(() => new SocketManager(opts), []); // opts estables idealmente
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    manager.connect().then((s) => {
      if (!mounted) return;
      setSocket(s);
      setConnected(s.connected);
      s.on("connect", () => setConnected(true));
      s.on("disconnect", () => setConnected(false));
    });
    return () => {
      mounted = false;
      manager.disconnect();
    };
  }, [manager]);

  const refreshAuth = async () => {
    await manager.refreshAuth();
  };

  return (
    <SocketCtx.Provider value={{ socket, connected, manager, refreshAuth }}>
      {children}
    </SocketCtx.Provider>
  );
}

// Hook para suscribirte a un evento de forma segura
// Hook para suscribirte a un evento de forma segura (conecta cuando haya socket)
export function useSocketEvent<E extends WsEventName>(
  event: E,
  handler: (payload: WsEventMap[E]) => void,
  deps: React.DependencyList = []
) {
  const { socket } = useSocketCtx();

  useEffect(() => {
    if (!socket) return;

    // 👇 firma compatible con Socket.IO: (...args:any[]) => void
    const h = (...args: unknown[]) => {
      handler(args[0] as WsEventMap[E]); // tomamos el primer argumento como payload
    };

    socket.on(event as string, h);
    return () => {
      socket.off(event as string, h);
    };
    // importante incluir handler si cambia; o usa un ref estable si prefieres
  }, [socket, event, handler, ...deps]);
}
