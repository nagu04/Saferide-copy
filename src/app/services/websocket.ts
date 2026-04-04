// websocket.ts
import React from 'react';
import type { WebSocketMessage } from '@/app/types';
import { showToast } from '@/app/utils/toast';
import { api } from '@/app/services/api';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnecting = false;
  private shouldReconnect = true;
  private isEnabled = !USE_MOCK_DATA;
  private wsUrl: string;
  private pingInterval: any = null;
  private statusHandlers: Set<(connected: boolean) => void> = new Set();

  constructor() {
    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
    this.wsUrl = `${WS_BASE_URL}/ws`;
  }

  private notifyStatusChange() {
    const connected = this.ws?.readyState === WebSocket.OPEN;
    this.statusHandlers.forEach(handler => handler(connected));
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
        this.ws?.send(JSON.stringify({
          type: "auth",
          token
        }));

        // 🔥 SUBSCRIBE TO ALL INCIDENTS
        this.ws?.send(JSON.stringify({
          type: "subscribe",
          incident_id: "all"
        }));

        this.ws?.send(JSON.stringify({
          type: "sync_request"
        }));

        console.log('WebSocket connected');
        this.notifyStatusChange();

        // Start ping
        if (this.pingInterval) clearInterval(this.pingInterval);

        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
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
        this.notifyStatusChange();
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;

        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }

        this.notifyStatusChange();

        if (this.shouldReconnect) {
          // Fast retries for first few attempts
          let delay = 1000;
          if (this.reconnectAttempts > 5) delay = 5000;
          if (this.reconnectAttempts > 10) delay = 10000;

          this.reconnectAttempts++;
          console.log("Reconnecting WebSocket in", delay, "ms");

          setTimeout(() => this.connect(), delay);
        }
      };
    } catch {
      this.isConnecting = false;
      this.notifyStatusChange();
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws?.close(1000, 'Client disconnecting');
    this.ws = null;
    this.notifyStatusChange();
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: (connected: boolean) => void): () => void {
    this.statusHandlers.add(handler);
    // immediately notify current state
    handler(this.isConnected());
    return () => this.statusHandlers.delete(handler);
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
  onStatsUpdate?: () => void,
  autoConnect: boolean = true
) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);

  // Handle WS connection status
  React.useEffect(() => {
    if (!autoConnect) return;

    setIsConnecting(true);

    websocketService.connect();

    const unsubscribeStatus = websocketService.onStatusChange((connected) => {
      setIsConnected(connected);
      setIsConnecting(!connected);

      if (connected) {
        api.dashboard.getRecentViolations(50).catch(() => {});
        api.dashboard.getStats().catch(() => {});
      }
    });

    return () => {
      unsubscribeStatus();
      //websocketService.disconnect();
    };
  }, [autoConnect]);

  // Handle incoming messages
  React.useEffect(() => {
    if (!onMessage && !onStatsUpdate) return;

    const unsubscribe = websocketService.onMessage((msg: WebSocketMessage) => {
      if (msg.type === 'stats_update') {
        onStatsUpdate?.();
      } else {
        onMessage?.(msg);
      }
    });

    return () => unsubscribe();
  }, [onMessage, onStatsUpdate]);

  return {
    isConnected,
    isConnecting,
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
    send: (msg: any) => websocketService.send(msg),
  };
}