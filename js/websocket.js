/**
 * WebSocket Manager - handles WebSocket connection and message routing
 */
class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.listeners = {};
  }

  // Connect to WebSocket server
  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.trigger('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.trigger('message', data);

          // Trigger specific event types
          if (data.type) {
            this.trigger(data.type, data);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        this.trigger('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.trigger('error', error);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.trigger('maxReconnectReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Send data to server
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('WebSocket is not connected');
      return false;
    }
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.listeners[event]) return;

    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  // Trigger event
  trigger(event, data) {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Check if connected
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // Close connection
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
