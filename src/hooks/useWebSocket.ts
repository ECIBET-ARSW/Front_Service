// hooks/useWebSocket.ts
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

// ✅ Crear una fábrica de SockJS que no use credenciales
const createSockJS = (url: string) => {
  // Crear el socket SockJS
  const socket = new SockJS(url);
  
  // Interceptar el envío de XMLHttpRequest para deshabilitar credenciales
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  // @ts-ignore - Override temporal
  XMLHttpRequest.prototype.open = function() {
    // @ts-ignore
    const result = originalXHROpen.apply(this, arguments);
    // Deshabilitar credenciales
    this.withCredentials = false;
    return result;
  };
  
  // Restaurar después de crear el socket
  setTimeout(() => {
    XMLHttpRequest.prototype.open = originalXHROpen;
    XMLHttpRequest.prototype.send = originalXHRSend;
  }, 0);
  
  return socket;
};

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

    // ✅ Crear SockJS con configuración segura
    const webSocketFactory = () => {
      // Crear socket con opciones
      const socket = new SockJS(url, null, {
        // @ts-ignore - Opciones no tipadas de SockJS
        transports: ['websocket', 'xhr-streaming', 'xhr-polling']
      });
      
      // Deshabilitar credenciales en el socket
      if (socket.transport && socket.transport.xhr) {
        // @ts-ignore
        socket.transport.xhr.withCredentials = false;
      }
      
      return socket;
    };

    const client = new Client({
      webSocketFactory,
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
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
      setConnected(false);
    };
  }, [url, topic, enabled, privateTopic, onMessage, onPrivateMessage]);

  return { connected, sendMessage };
}
