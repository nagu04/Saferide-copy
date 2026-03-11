/**
 * WebSocket Service for Real-time Updates
 * 
 * Connects to Python FastAPI WebSocket endpoint for real-time violation updates
 * 
 * BACKEND REQUIREMENT:
 * ====================
 * Your Python FastAPI backend should implement:
 * 
 * WebSocket endpoint: ws://localhost:8000/ws/violations
 * 
 * Example FastAPI WebSocket implementation:
 * 
 * ```python
 * from fastapi import WebSocket, WebSocketDisconnect
 * 
 * @app.websocket("/ws/violations")
 * async def websocket_endpoint(websocket: WebSocket):
 *     await websocket.accept()
 *     try:
 *         while True:
 *             # Send new violation when detected
 *             violation_data = await get_new_violation()
 *             await websocket.send_json({
 *                 "type": "new_violation",
 *                 "timestamp": datetime.now().isoformat(),
 *                 "data": violation_data
 *             })
 *     except WebSocketDisconnect:
 *         print("Client disconnected")
 * ```
 */

import type { WebSocketMessage, NewViolationMessage, ViolationUpdatedMessage } from '@/app/types';

type MessageHandler = (message: WebSocketMessage) => void;

// Check if we're using mock data
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnecting = false;
  private shouldReconnect = true;
  private isEnabled = !USE_MOCK_DATA;

  private wsUrl: string;

  constructor() {
    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
    this.wsUrl = `${WS_BASE_URL}/ws/violations`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    // Don't connect if using mock data
    if (!this.isEnabled) {
      console.log('WebSocket disabled - using mock data mode');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      console.log('Connecting to WebSocket:', this.wsUrl);
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Send authentication token if available
        const token = localStorage.getItem('access_token');
        if (token && this.ws) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            token,
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message.type);
          
          // Notify all registered handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('WebSocket connection error (this is normal if backend is not running)');
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed - backend may not be running (this is OK in mock mode)');
        this.isConnecting = false;
        this.ws = null;

        // Only attempt to reconnect if explicitly enabled and not too many attempts
        if (this.shouldReconnect && this.isEnabled && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Will retry WebSocket connection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);
          
          setTimeout(() => {
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.warn('WebSocket not available - continuing in offline mode');
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Send a message to the server
   */
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent (this is normal in mock mode)');
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * Enable/disable WebSocket
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.disconnect();
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;

// ==================== React Hooks ====================

/**
 * React hook for WebSocket connection
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useWebSocket((message) => {
 *     if (message.type === 'new_violation') {
 *       console.log('New violation:', message.data);
 *     }
 *   });
 * }
 * ```
 */
export function useWebSocket(
  onMessage?: (message: WebSocketMessage) => void,
  autoConnect: boolean = true
): {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: any) => void;
} {
  const [isConnected, setIsConnected] = React.useState(websocketService.isConnected());

  React.useEffect(() => {
    // Only auto-connect if not using mock data
    if (autoConnect && !USE_MOCK_DATA) {
      websocketService.connect();
    }

    // Register message handler if provided
    let unsubscribe: (() => void) | undefined;
    if (onMessage) {
      unsubscribe = websocketService.onMessage(onMessage);
    }

    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(websocketService.isConnected());
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(interval);
      if (unsubscribe) {
        unsubscribe();
      }
      // Don't auto-disconnect on unmount - let other components use it
    };
  }, [onMessage, autoConnect]);

  return {
    isConnected,
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
    send: (message: any) => websocketService.send(message),
  };
}

// Import React for the hook
import React from 'react';