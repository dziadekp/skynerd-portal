// WebSocket client for portal chat with JWT auth

import { API_BASE_URL } from "./constants";

interface WebSocketOptions {
  roomId: string;
  onMessage: (data: unknown) => void;
  onTyping?: (data: { user_id: number; user_name: string; is_typing: boolean }) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function createPortalWebSocket(options: WebSocketOptions) {
  // Get the JWT token for WS auth — we need it from the cookie via an API call
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isDestroyed = false;

  async function connect() {
    if (isDestroyed) return;

    // Fetch a fresh access token for WS
    const tokenRes = await fetch("/api/auth/me", { credentials: "include" });
    if (!tokenRes.ok) return;

    // We need the raw access token for WS. Get it from a dedicated endpoint.
    const wsTokenRes = await fetch("/api/auth/ws-token", { credentials: "include" });
    if (!wsTokenRes.ok) return;
    const { token } = await wsTokenRes.json();

    // Build WS URL — strip protocol and trailing slash
    const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
    const wsHost = API_BASE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const wsUrl = `${wsProtocol}://${wsHost}/ws/portal-chat/room/${options.roomId}/?token=${token}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
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
      if (!isDestroyed) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (error) => {
      options.onError?.(error);
    };
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
