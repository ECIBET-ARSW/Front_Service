// Generic WebSocket STOMP hook.
// Opens a connection when the component mounts and closes it on unmount.
// Each game service reuses this hook — only the URL and topic change.
// Requires: npm install @stomp/stompjs sockjs-client @types/sockjs-client
import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseWebSocketOptions {
  url: string;           // WebSocket endpoint, e.g. http://localhost:8090/ws
  topic: string;         // STOMP topic to subscribe, e.g. /topic/roulette/{sessionId}
  onMessage: (body: unknown) => void;
  enabled?: boolean;     // Allows delaying connection until a sessionId is ready
}

export function useWebSocket({ url, topic, onMessage, enabled = true }: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const [connected, setConnected] = useState(false);

  const sendMessage = useCallback((destination: string, body: unknown) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        subscriptionRef.current = client.subscribe(topic, (msg: IMessage) => {
          try {
            onMessage(JSON.parse(msg.body));
          } catch {
            onMessage(msg.body);
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionRef.current?.unsubscribe();
      client.deactivate();
      setConnected(false);
    };
  }, [url, topic, enabled]); // onMessage excluded intentionally — use useCallback on the caller side

  return { connected, sendMessage };
}
