"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useChatMessages, useMarkRoomRead } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { createPortalWebSocket } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import Link from "next/link";

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { data: initialMessages, isLoading } = useChatMessages(roomId);
  const markRead = useMarkRoomRead();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<ReturnType<typeof createPortalWebSocket> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial messages
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read on mount
  useEffect(() => {
    if (roomId) {
      markRead.mutate(roomId);
    }
  }, [roomId]);

  // Connect WebSocket
  useEffect(() => {
    const ws = createPortalWebSocket({
      roomId,
      onMessage: (data) => {
        const msg = data as ChatMessage;
        setMessages((prev) => [...prev, msg]);
      },
      onTyping: (data) => {
        if (data.is_typing) {
          setTypingUsers((prev) => new Map(prev).set(data.user_id, data.user_name));
          // Clear after 5 seconds
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(data.user_id);
              return next;
            });
          }, 5000);
        } else {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(data.user_id);
            return next;
          });
        }
      },
      onOpen: () => setIsConnected(true),
      onClose: () => setIsConnected(false),
    });

    wsRef.current = ws;
    return () => ws.destroy();
  }, [roomId]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !wsRef.current) return;
    wsRef.current.sendMessage(text);
    wsRef.current.sendStopTyping();
    setInput("");
  }, [input]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      wsRef.current?.sendTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        wsRef.current?.sendStopTyping();
      }, 2000);
    },
    []
  );

  const typingNames = Array.from(typingUsers.values());

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/chat" className="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h2 className="font-semibold">Chat</h2>
          <p className="text-xs text-muted-foreground">
            {isConnected ? "Connected" : "Connecting..."}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 px-2">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={cn(
                  "flex",
                  msg.is_own ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    msg.is_own
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-foreground"
                  )}
                >
                  {!msg.is_own && (
                    <p className="mb-0.5 text-[10px] font-medium opacity-70">
                      {msg.user.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={cn(
                    "mt-1 text-[10px]",
                    msg.is_own ? "text-white/60" : "text-muted-foreground"
                  )}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <p className="px-4 text-xs text-muted-foreground animate-pulse">
          {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing...
        </p>
      )}

      {/* Input */}
      <div className="flex gap-2 border-t pt-4">
        <Input
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="h-11"
          disabled={!isConnected}
        />
        <Button onClick={handleSend} disabled={!input.trim() || !isConnected} className="h-11 px-6">
          Send
        </Button>
      </div>
    </div>
  );
}
