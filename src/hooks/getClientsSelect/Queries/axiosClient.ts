// api/axiosClient.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// ⚠️ Asegúrate que esto existe en tu .env y reinicia el dev server
const API_URL = import.meta.env.VITE_API_URL; // p.ej. http://localhost:3000
console.log("🔧 axios baseURL:", API_URL);

// Para medir duración por request
declare module "axios" {
  // agregamos metadata al config para medir tiempos
  export interface AxiosRequestConfig {
    metadata?: { start: number };
  }
}

// 🔧 Cliente centralizado
export const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // si usas cookies/sesión
  timeout: 10000,
  headers: {
    Accept: "application/json",
    // "Content-Type": "application/json",
  },
});

export class HttpError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
    this.name = "HttpError";
  }
}

// Utilidad para armar URL completa en logs
function fullUrl(cfg: AxiosRequestConfig) {
  try {
    if (!cfg.baseURL) return cfg.url ?? "(sin url)";
    return new URL(cfg.url ?? "", cfg.baseURL).toString();
  } catch {
    return `${cfg.baseURL ?? ""}${cfg.url ?? ""}`;
  }
}

// 🟦 Request logger
axiosClient.interceptors.request.use((cfg) => {
  cfg.metadata = { start: performance.now() };
  const url = fullUrl(cfg);
  console.groupCollapsed(
    `➡️  ${String(cfg.method).toUpperCase()} ${url}  withCredentials=${
      cfg.withCredentials
    }`
  );
  console.log("params:", cfg.params);
  if (cfg.data) console.log("data:", cfg.data);
  console.log("headers:", cfg.headers);
  console.groupEnd();
  return cfg;
});

// 🟩 Response ok logger
axiosClient.interceptors.response.use(
  (res: AxiosResponse) => {
    const ms =
      res.config?.metadata?.start != null
        ? Math.round(performance.now() - res.config.metadata.start)
        : undefined;
    const url = fullUrl(res.config);
    console.groupCollapsed(
      `✅ ${res.status} ${res.statusText} — ${String(
        res.config.method
      ).toUpperCase()} ${url}` + (ms != null ? ` (${ms} ms)` : "")
    );
    console.log("data:", res.data);
    console.log("headers:", res.headers);
    console.groupEnd();
    return res;
  },
  (error: unknown) => {
    // ❌ Error logger (incluye casos CORS/timeout)
    if (axios.isCancel(error)) {
      console.warn("⏹️ Request cancelada");
      return Promise.reject(error);
    }

    const ax = error as AxiosError;
    const url = ax.config ? fullUrl(ax.config) : "(sin url)";
    const ms =
      ax.config?.metadata?.start != null
        ? Math.round(performance.now() - (ax.config.metadata.start as number))
        : undefined;

    console.groupCollapsed(
      `⛔ Axios error — ${String(ax.config?.method).toUpperCase()} ${url}` +
        (ms != null ? ` (${ms} ms)` : "")
    );
    console.error("message:", ax.message);
    console.error("code:", ax.code); // p.ej. ERR_NETWORK, ECONNABORTED (timeout)
    console.error("status:", ax.response?.status ?? "(sin status)");
    console.error("response headers:", ax.response?.headers);
    console.error("response data:", ax.response?.data);
    console.error("request headers:", ax.config?.headers);
    console.error("withCredentials:", ax.config?.withCredentials);
    console.groupEnd();

    const status = ax.response?.status ?? 0;
    const body = ax.response?.data;
    const message = (body as any)?.message || ax.message || "Error de red";
    return Promise.reject(new HttpError(message, status, body));
  }
);
