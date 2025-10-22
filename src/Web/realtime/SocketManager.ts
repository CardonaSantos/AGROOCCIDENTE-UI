import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import type { WsEventMap, WsEventName } from "./socket-events";

type TokenGetter = () => Promise<string | null> | string | null;

export type SocketManagerOptions = {
  baseUrl: string; // e.g. import.meta.env.VITE_WS_URL
  namespace?: string; // default: '/ws'
  getToken: TokenGetter;
  path?: string; // default: '/socket.io'
  withCredentials?: boolean; // si usas cookies
  debug?: boolean;
};
function decodeJwtPayload(token?: string | null): any {
  if (!token) return null;
  const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
  const parts = raw.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export class SocketManager {
  private socket: Socket | null = null;
  private opts: SocketManagerOptions;
  private connecting = false;

  constructor(opts: SocketManagerOptions) {
    this.opts = { namespace: "/ws", path: "/socket.io", ...opts };
    if (this.opts.debug) (window as any).__SOCKET_DEBUG__ = true;
  }

  public get instance(): Socket | null {
    return this.socket;
  }

  public async connect(): Promise<Socket> {
    if (this.socket?.connected) return this.socket;
    if (this.connecting) {
      return new Promise((r) => {
        const i = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(i);
            r(this.socket!);
          }
        }, 50);
      });
    }

    this.connecting = true;
    const token = await this.resolveToken();
    const bearer = token
      ? token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
      : null;

    // intentar extraer identidad del JWT: sub/id/sucursalId/rol
    const payload = decodeJwtPayload(bearer);
    const userId =
      Number(payload?.sub ?? payload?.id ?? payload?.userId) || undefined;
    const sucursalId = Number(payload?.sucursalId) || undefined;
    const rol = String(payload?.rol || "") || undefined;

    const url = this.opts.baseUrl + (this.opts.namespace ?? "/ws");

    const socketOpts: Partial<ManagerOptions & SocketOptions> = {
      path: this.opts.path,
      transports: ["websocket"],
      withCredentials: this.opts.withCredentials ?? false,
      // manda token + identidad en auth (server lo leerá de handshake.auth)
      auth: { token: bearer, userId, sucursalId, rol },
      query: { userId, sucursalId, rol },

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      autoConnect: true,
    };

    this.socket = io(url, socketOpts);

    if (this.opts.debug) {
      this.socket.on("connect", () =>
        console.log("[WS] CONECTADO AL SOCKET", this.socket?.id)
      );
      this.socket.on("disconnect", (reason) =>
        console.log("[WS] disconnected", reason)
      );
      this.socket.on("connect_error", (e: any) => {
        console.log("[WS] connect_error", e?.message, e?.data || "");
      });
    }

    (window as any).socket = this.socket;
    this.connecting = false;
    return this.socket;
  }

  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Permite refrescar token sin reconstruir toda la app
  public async refreshAuth() {
    if (!this.socket) return;
    const token = await this.resolveToken();
    // Recomendado por Socket.IO: actualizar auth y reconectar
    (this.socket as any).auth = { token };
    this.socket.connect();
  }

  public on<E extends WsEventName>(
    event: E,
    handler: (payload: WsEventMap[E]) => void
  ) {
    this.socket?.on(event, handler as any);
  }
  public off<E extends WsEventName>(
    event: E,
    handler: (payload: WsEventMap[E]) => void
  ) {
    this.socket?.off(event, handler as any);
  }
  public emit<E extends WsEventName>(event: E, payload: WsEventMap[E]) {
    this.socket?.emit(event, payload as any);
  }

  private async resolveToken(): Promise<string | null> {
    try {
      const t = await this.opts.getToken();
      return t ?? null;
    } catch {
      return null;
    }
  }
}
