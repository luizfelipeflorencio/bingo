require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const throttle = require('lodash.throttle');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'SUA_URL_AQUI')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Game state (in-memory)
let gameState = {
  drawnNumbers: [],
  lastDrawn: null
};

// Load state on startup
async function loadState() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bingo_state')
        .select('state')
        .eq('id', 1)
        .single();

      if (data) {
        gameState = data.state;
        console.log('Game state loaded from Supabase');
      } else if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error loading from Supabase:', error.message);
      }
    } catch (err) {
      console.error('Failed to load state from Supabase:', err);
    }
  } else {
    console.log('Supabase not configured, using local file');
    const STATE_FILE = path.join(__dirname, 'gameState.json');
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, 'utf8');
        gameState = JSON.parse(data);
        console.log('Game state loaded from disk');
      }
    } catch (err) {
      console.error('Failed to load state from disk:', err);
    }
  }
}

loadState();

const saveStateAtomic = throttle(async () => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('bingo_state')
        .upsert({ id: 1, state: gameState });

      if (error) console.error('Failed to save to Supabase:', error.message);
    } catch (err) {
      console.error('Failed to save to Supabase:', err);
    }
  } else {
    try {
      const STATE_FILE = path.join(__dirname, 'gameState.json');
      const tempFile = `${STATE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(gameState, null, 2));
      fs.renameSync(tempFile, STATE_FILE);
    } catch (err) {
      console.error('Failed to save state to disk:', err);
    }
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

  socket.on('PING', () => {
    socket.emit('PONG');
  });

  socket.on('drawNumber', (n) => {
    if (!socket.isHost) return;

    const num = parseInt(n);
    if (isNaN(num) || num < 1 || num > 90) return;
    if (gameState.drawnNumbers.includes(num)) return;

    gameState.drawnNumbers.push(num);
    gameState.lastDrawn = num;
    io.emit('numberDrawn', num);
    if (typeof saveStateAtomic === 'function') {
      saveStateAtomic();
    } else {
      console.error('saveStateAtomic is not a function!');
    }
    console.log(`Host ${socket.id} drew number: ${num}`);
  });

  socket.on('resetGame', () => {
    if (!socket.isHost) return;

    gameState = {
      drawnNumbers: [],
      lastDrawn: null
    };
    io.emit('SYNC', gameState);
    if (typeof saveStateAtomic === 'function') {
      saveStateAtomic();
    } else {
      console.error('saveStateAtomic is not a function!');
    }
    console.log(`Host ${socket.id} reset the game`);
  });
});

server.listen(PORT, () => {
  console.log(`Bingo Server running on port ${PORT} - PID: ${process.pid}`);
});
