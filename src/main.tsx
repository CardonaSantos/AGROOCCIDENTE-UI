import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { GoogleMapsProvider } from "./Crm/CrmRutas/CrmRutasCobro/GoogleMapsProvider .tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryProvider } from "./Server/QueryProvider.tsx";
import { SocketProvider } from "./Web/realtime/SocketProvider.tsx";
const WS_URL = import.meta.env.VITE_WS_URL; // ej: http://localhost:3000
const WS_NS = import.meta.env.VITE_WS_NAMESPACE ?? "/ws"; // ej: /ws
const WS_PATH = import.meta.env.VITE_WS_PATH ?? "/socket.io";

const getToken = () => localStorage.getItem("authTokenPos");

const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <StrictMode>
      <SocketProvider
        baseUrl={WS_URL}
        namespace={WS_NS}
        path={WS_PATH}
        getToken={getToken}
        debug={import.meta.env.DEV}
        withCredentials={false}
      >
        <GoogleMapsProvider>
          <QueryClientProvider client={queryClient}>
            <QueryProvider>
              <App />
            </QueryProvider>
          </QueryClientProvider>
        </GoogleMapsProvider>
      </SocketProvider>
    </StrictMode>
  </ThemeProvider>
);
