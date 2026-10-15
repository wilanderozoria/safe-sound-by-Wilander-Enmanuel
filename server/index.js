const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory state to keep track of the last known levels per room
// Structure: { roomId: { micId: { level, timestamp } } }
const roomStates = {};

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // When a client (classroom) sends a level update
  socket.on('level-update', (data) => {
    const { roomId, micId, level, timestamp } = data;

    if (!roomId || micId === undefined || level === undefined) {
      console.error('Invalid level-update data:', data);
      return;
    }

    // Update internal state
    if (!roomStates[roomId]) {
      roomStates[roomId] = {};
    }
    roomStates[roomId][micId] = { level, timestamp };

    // Broadcast to all monitors
    // We send the specific mic update, and monitors will handle the aggregation
    socket.broadcast.emit('monitor-update', {
      type: 'MIC_UPDATE',
      data: { roomId, micId, level, timestamp }
    });
  });

  // When a monitor connects, send them the current state of all rooms
  socket.on('request-initial-state', () => {
    socket.emit('initial-state', roomStates);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SafeSound Relay Server running on port ${PORT}`);
});
