const urlParams = new URLSearchParams(window.location.search);
const key = urlParams.get('key');

const socket = io({
    auth: {
        token: key
    },
    reconnection: true
});

const statusEl = document.getElementById('status');
const authStatusEl = document.getElementById('auth-status');
const authIndicatorEl = document.getElementById('auth-indicator');
const gameControlsEl = document.getElementById('game-controls');
const numberPadEl = document.getElementById('number-pad');
const resetBtn = document.getElementById('reset-btn');

// LocalStorage Persistence
const STORAGE_KEY = 'bingo_host_state';

function saveToLocal(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.error('Failed to save host state:', err);
    }
}

function loadFromLocal() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (err) {
        console.error('Failed to load host state:', err);
        return null;
    }
}

// Generate number pad
for (let i = 1; i <= 90; i++) {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.id = `num-${i}`;
    btn.textContent = i;
    btn.onclick = () => {
        if (!btn.classList.contains('drawn')) {
            socket.emit('drawNumber', i);
        }
    };
    numberPadEl.appendChild(btn);
}

// Initial Load from LocalStorage
const localState = loadFromLocal();
if (localState && localState.drawnNumbers) {
    updateGrid(localState.drawnNumbers);
}

resetBtn.onclick = () => {
    if (window.confirm('Are you sure you want to reset the game? This will clear all drawn numbers for everyone.')) {
        socket.emit('resetGame');
    }
};

socket.on('connect', () => {
    console.log('Connected to server');
    statusEl.textContent = 'Connected';
    statusEl.className = 'connected';
    authIndicatorEl.textContent = 'Attempting host connection...';
});

socket.on('disconnect', () => {
    statusEl.textContent = 'Disconnected';
    statusEl.className = 'disconnected';
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
    statusEl.textContent = 'Connection Error';
    statusEl.className = 'error';
});

socket.on('authorized', (data) => {
    if (data.isHost) {
        authStatusEl.textContent = 'Authenticated as Host';
        authStatusEl.className = 'authorized';
        authIndicatorEl.classList.add('hidden');
        gameControlsEl.classList.remove('hidden');
    } else {
        authStatusEl.textContent = 'Unauthorized';
        authStatusEl.className = 'unauthorized';
        authIndicatorEl.textContent = 'Unauthorized: Invalid Key';
        gameControlsEl.classList.add('hidden');
    }
});

socket.on('SYNC', (state) => {
    updateGrid(state.drawnNumbers);
    saveToLocal(state);
});

socket.on('numberDrawn', (num) => {
    const btn = document.getElementById(`num-${num}`);
    if (btn) btn.classList.add('drawn');

    // Update local state
    const state = loadFromLocal() || { drawnNumbers: [] };
    if (!state.drawnNumbers.includes(num)) {
        state.drawnNumbers.push(num);
        saveToLocal(state);
    }
});

function updateGrid(drawnNumbers) {
    // Clear all drawn states
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.classList.remove('drawn');
    });
    // Set new drawn states
    drawnNumbers.forEach(num => {
        const btn = document.getElementById(`num-${num}`);
        if (btn) btn.classList.add('drawn');
    });
}
