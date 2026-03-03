// WebSocket client for portal chat with JWT auth

import { API_BASE_URL } from "./constants";

interface WebSocketOptions {
  roomId: string;
  onMessage: (data: unknown) => void;
  onTyping?: (data: { user_id: number; user_name: string; is_typing: boolean }) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event | Error) => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;

export function createPortalWebSocket(options: WebSocketOptions) {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isDestroyed = false;
  let reconnectAttempts = 0;

  async function connect() {
    if (isDestroyed) return;

    try {
      // Fetch a fresh access token for WS
      const tokenRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!tokenRes.ok) {
        options.onError?.(new Error("Authentication failed"));
        options.onClose?.();
        return;
      }

      const wsTokenRes = await fetch("/api/auth/ws-token", { credentials: "include" });
      if (!wsTokenRes.ok) {
        options.onError?.(new Error("Failed to get WebSocket token"));
        options.onClose?.();
        return;
      }
      const { token } = await wsTokenRes.json();

      // Build WS URL
      const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
      const wsHost = API_BASE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const wsUrl = `${wsProtocol}://${wsHost}/ws/portal-chat/room/${options.roomId}/?token=${token}`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        reconnectAttempts = 0;
        options.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "typing") {
            options.onTyping?.(data);
          } else {
            options.onMessage(data);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        options.onClose?.();
        if (!isDestroyed && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          reconnectTimer = setTimeout(connect, 3000);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          options.onError?.(new Error("Max reconnection attempts reached"));
        }
      };

      ws.onerror = (error) => {
        options.onError?.(error);
      };
    } catch (err) {
      options.onError?.(err instanceof Error ? err : new Error("Connection failed"));
      options.onClose?.();
    }
  }

  function send(data: unknown) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function sendMessage(text: string) {
    send({ type: "message", message: text });
  }

  function sendTyping() {
    send({ type: "typing" });
  }

  function sendStopTyping() {
    send({ type: "stop_typing" });
  }

  function destroy() {
    isDestroyed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  }

  // Start connecting
  connect();

  return { send, sendMessage, sendTyping, sendStopTyping, destroy };
}
