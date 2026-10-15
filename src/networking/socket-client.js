export class SocketClient {
  constructor(serverUrl = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
    this.socket = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Using the Socket.io client from a CDN for simplicity in a vanilla JS app
      if (!window.io) {
        reject(new Error('Socket.io client library not loaded. Please add <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script> to index.html'));
      }

      this.socket = io(this.serverUrl);

      this.socket.on('connect', () => {
        console.log('Connected to SafeSound Relay Server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });
    });
  }

  sendLevel(roomId, micId, level) {
    if (!this.socket) return;

    this.socket.emit('level-update', {
      roomId,
      micId,
      level,
      timestamp: Date.now()
    });
  }

  onMonitorUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('monitor-update', (data) => callback(data));
  }

  requestInitialState(callback) {
    if (!this.socket) return;
    this.socket.emit('request-initial-state');
    this.socket.on('initial-state', (state) => callback(state));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
