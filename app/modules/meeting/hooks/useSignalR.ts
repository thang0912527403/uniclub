import { useState, useEffect, useRef } from "react";
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
} from "@microsoft/signalr";
import Cookies from "js-cookie";

/**
 * Manages the SignalR hub connection lifecycle.
 * Handles connect, automatic reconnect, and cleanup.
 *
 * @returns connection — the active HubConnection (or null)
 * @returns isConnected — whether the connection is live
 */
export function useSignalR() {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const init = async () => {
      const accessToken = Cookies.get("accessToken");
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "https://chuyencongnhan.io.vn";

      const conn = new HubConnectionBuilder()
        .withUrl(`${backendUrl}/webrtc`, {
          accessTokenFactory: () => accessToken || "",
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      connectionRef.current = conn;
      setConnection(conn);

      conn.onclose(() => {
        console.log("[SignalR] Connection closed");
        setIsConnected(false);
      });

      conn.onreconnected(() => {
        console.log("[SignalR] Reconnected");
        setIsConnected(true);
      });

      conn.onreconnecting(() => {
        console.log("[SignalR] Reconnecting...");
        setIsConnected(false);
      });

      const startConnection = async () => {
        try {
          await conn.start();
          console.log("[SignalR] Connected");
          setIsConnected(true);
        } catch (err) {
          console.error("[SignalR] Connection failed:", err);
          // Try again in 5s
          setTimeout(startConnection, 5000);
        }
      };

      startConnection();

      return () => {
        conn.stop();
      };
    };

    init();
  }, []);

  return { connection, isConnected };
}
