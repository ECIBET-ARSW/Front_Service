// hooks/useWebSocket.ts - ÚNICO ARCHIVO A MODIFICAR
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

    // ✅ ÚNICO CAMBIO: Configurar SockJS sin credenciales
    const sockjsFactory = () => {
      // @ts-ignore - Ignorar errores de tipo de SockJS
      return new SockJS(url, null, {
        sessionId: () => Math.random().toString(36).substring(2, 15)
      });
    };

    // Configurar XMLHttpRequest para no enviar credenciales
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
      // @ts-ignore
      this.withCredentials = false;
      return originalSend.apply(this, arguments);
    };

    const client = new Client({
      webSocketFactory: sockjsFactory,
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
      // Restaurar XMLHttpRequest original
      XMLHttpRequest.prototype.send = originalSend;
    };
  }, [url, topic, enabled, privateTopic, onMessage, onPrivateMessage]);

  return { connected, sendMessage };
}
