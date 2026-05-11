require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const throttle = require('lodash.throttle');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
});

const STATE_FILE = path.join(__dirname, 'gameState.json');

// Game state (in-memory)
let gameState = {
  drawnNumbers: [],
  lastDrawn: null
};

// Load state on startup
try {
  if (fs.existsSync(STATE_FILE)) {
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    gameState = JSON.parse(data);
    console.log('Game state loaded from disk');
  }
} catch (err) {
  console.error('Failed to load state from disk:', err);
}

const saveStateAtomic = throttle(() => {
  try {
    const tempFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(gameState, null, 2));
    fs.renameSync(tempFile, STATE_FILE);
  } catch (err) {
    console.error('Failed to save state to disk:', err);
  }
}, 1000);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === process.env.HOST_SECRET) {
    socket.isHost = true;
    console.log(`Host authenticated: ${socket.id}`);
  } else {
    socket.isHost = false;
  }
  next();
});

const PORT = process.env.PORT || 3003;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Emit authorization status
  socket.emit('authorized', { isHost: socket.isHost });

  // Pitfall 1: Send state snapshot on connect
  try {
    socket.emit('SYNC', gameState);
  } catch (err) {
    console.error('Failed to emit SYNC:', err);
  }

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on('drawNumber', (n) => {
    if (!socket.isHost) return;

    const num = parseInt(n);
    if (isNaN(num) || num < 1 || num > 90) return;
    if (gameState.drawnNumbers.includes(num)) return;

    gameState.drawnNumbers.push(num);
    gameState.lastDrawn = num;
    io.emit('numberDrawn', num);
    saveStateAtomic();
    console.log(`Host ${socket.id} drew number: ${num}`);
  });

  socket.on('resetGame', () => {
    if (!socket.isHost) return;

    gameState = {
      drawnNumbers: [],
      lastDrawn: null
    };
    io.emit('SYNC', gameState);
    saveStateAtomic();
    console.log(`Host ${socket.id} reset the game`);
  });
});

server.listen(PORT, () => {
  console.log(`Bingo Server running on port ${PORT}`);
});
