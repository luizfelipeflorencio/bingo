require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Game state (in-memory)
let gameState = {
  drawnNumbers: [],
  lastDrawn: null
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Pitfall 1: Send state snapshot on connect
  try {
    socket.emit('SYNC', gameState);
  } catch (err) {
    console.error('Failed to emit SYNC:', err);
  }

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Periodic heartbeat (PITFALL 7 - already handled by Socket.io's ping/pong)
setInterval(() => {
  if (io.engine.clientsCount > 0) {
    const randomNum = Math.floor(Math.random() * 90) + 1;

    // Update state
    gameState.lastDrawn = randomNum;
    if (!gameState.drawnNumbers.includes(randomNum)) {
      gameState.drawnNumbers.push(randomNum);
    }

    io.emit('numberDrawn', randomNum);
    console.log(`[Simulation] Pushed ${randomNum} to ${io.engine.clientsCount} clients`);
  }
}, 5000);

server.listen(PORT, () => {
  console.log(`Bingo Server running on port ${PORT}`);
});
