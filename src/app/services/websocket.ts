import React from 'react';
import type { WebSocketMessage } from '@/app/types';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnecting = false;
  private shouldReconnect = true;
  private isEnabled = !USE_MOCK_DATA;
  private wsUrl: string;

  constructor() {
    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
    this.wsUrl = `${WS_BASE_URL}/ws/violations`;
  }

  connect(): void {
    if (!this.isEnabled || this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        const token = localStorage.getItem('access_token');
        if (token && this.ws) this.ws.send(JSON.stringify({ type: 'auth', token }));
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (err) {
          console.error('WebSocket parse error', err);
        }
      };

      this.ws.onerror = () => {
        console.warn('WebSocket error');
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch {
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.ws?.close(1000, 'Client disconnecting');
    this.ws = null;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) this.disconnect();
  }
}

const websocketService = new WebSocketService();

export default websocketService;

export function useWebSocket(
  onMessage?: (message: WebSocketMessage) => void,
  autoConnect: boolean = true
) {
  const [isConnected, setIsConnected] = React.useState(websocketService.isConnected());

  React.useEffect(() => {
    if (autoConnect && !USE_MOCK_DATA) websocketService.connect();

    let unsubscribe: (() => void) | undefined;
    if (onMessage) unsubscribe = websocketService.onMessage(onMessage);

    const interval = setInterval(() => setIsConnected(websocketService.isConnected()), 2000);

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [onMessage, autoConnect]);

  return {
    isConnected,
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
    send: (msg: any) => websocketService.send(msg),
  };
}