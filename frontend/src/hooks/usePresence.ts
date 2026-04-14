"use client";

import { useEffect, useRef, useState } from "react";
import { generateUUID } from "@/lib/uuid";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/presence";

// Stable client ID — survives re-renders and Strict Mode double-mount.
// Generated once per browser tab (not per component mount).
let _tabClientId: string | null = null;
function getTabClientId(): string {
  if (!_tabClientId) {
    _tabClientId = generateUUID();
  }
  return _tabClientId;
}

export function usePresence() {
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);
  // Track the live socket so the cleanup always closes the right one.
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let dead = false; // set to true on cleanup to prevent reconnect after unmount

    function connect() {
      if (dead) return;

      // Close any previous socket before opening a new one.
      wsRef.current?.close();

      const clientId = getTabClientId();
      const url = `${WS_URL}?clientId=${clientId}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!dead) setConnected(true);
      };
      ws.onclose = () => {
        if (dead) return;
        setConnected(false);
        // Exponential back-off capped at 10 s
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        ws.close();
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "presence") setCount(data.count);
        } catch {}
      };
    }

    connect();

    return () => {
      dead = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return { count, connected };
}
