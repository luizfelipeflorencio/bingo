const urlParams = new URLSearchParams(window.location.search);
const key = urlParams.get('key');

const socket = io({
    auth: {
        token: key
    }
});

const statusEl = document.getElementById('status');
const authStatusEl = document.getElementById('auth-status');
const authIndicatorEl = document.getElementById('auth-indicator');
const gameControlsEl = document.getElementById('game-controls');
const numberPadEl = document.getElementById('number-pad');
const resetBtn = document.getElementById('reset-btn');

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

resetBtn.onclick = () => {
    if (window.confirm('Are you sure you want to reset the game? This will clear all drawn numbers for everyone.')) {
        socket.emit('resetGame');
    }
};

socket.on('connect', () => {
    console.log('Connected to server');
    statusEl.textContent = 'Connected';
    statusEl.className = 'connected';

    // We'll know if we're authenticated by whether the server accepts our host-only commands
    // or we can emit a request for confirmation.
    // For now, let's assume if we connect with a key, we're attempting host role.
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

// Listen for a custom 'authorized' event we'll add to server.js in a moment
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
});

socket.on('numberDrawn', (num) => {
    const btn = document.getElementById(`num-${num}`);
    if (btn) btn.classList.add('drawn');
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
