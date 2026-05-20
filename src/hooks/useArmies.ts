// hooks/useWebSocket.ts - SOLO cambiar la fábrica de SockJS
import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseWebSocketOptions {
  url: string;
  topic: string;
  onMessage: (body: unknown) => void;
  enabled?: boolean;
  privateTopic?: string;
  onPrivateMessage?: (body: unknown) => void;
}

export function useWebSocket({ url, topic, onMessage, enabled = true, privateTopic, onPrivateMessage }: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const privateSubRef = useRef<StompSubscription | null>(null);
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

    // ✅ SOLO ESTO CAMBIA - Configurar SockJS sin credenciales
    const sockjsFactory = () => new SockJS(url, null, {
      withCredentials: false,  // ← CLAVE: deshabilitar credenciales (evita el 403)
      transports: ['websocket', 'xhr-streaming', 'xhr-polling']
    });

    const client = new Client({
      webSocketFactory: sockjsFactory,  // Usar la fábrica personalizada
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        subscriptionRef.current = client.subscribe(topic, (msg: IMessage) => {
          try { onMessage(JSON.parse(msg.body)); } catch { onMessage(msg.body); }
        });
        if (privateTopic && onPrivateMessage) {
          privateSubRef.current = client.subscribe(privateTopic, (msg: IMessage) => {
            try { onPrivateMessage(JSON.parse(msg.body)); } catch { onPrivateMessage(msg.body); }
          });
        }
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionRef.current?.unsubscribe();
      privateSubRef.current?.unsubscribe();
      client.deactivate();
      setConnected(false);
    };
  }, [url, topic, enabled, privateTopic, onMessage, onPrivateMessage]);

  return { connected, sendMessage };
}
