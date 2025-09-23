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
    if (this.connecting)
      return new Promise((r) => {
        const i = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(i);
            r(this.socket!);
          }
        }, 50);
      });

    this.connecting = true;
    const token = await this.resolveToken();

    const url = this.opts.baseUrl + (this.opts.namespace ?? "/ws");

    const socketOpts: Partial<ManagerOptions & SocketOptions> = {
      path: this.opts.path,
      transports: ["websocket"],
      withCredentials: this.opts.withCredentials ?? false,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      autoConnect: true,
    };

    this.socket = io(url, socketOpts);

    // Debug
    if (this.opts.debug) {
      this.socket.on("connect", () =>
        console.log("[WS] CONECTADO AL SOCKET", this.socket?.id)
      );
      this.socket.on("disconnect", (r) => console.log("[WS] disconnected", r));
      this.socket.on("connect_error", (e) =>
        console.log("[WS] connect_error", e.message)
      );
    }

    // Exponer para inspección en dev
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
