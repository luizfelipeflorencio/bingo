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
        authIndicatorEl.textContent = 'Host Access Granted';
    } else {
        authStatusEl.textContent = 'Unauthorized';
        authStatusEl.className = 'unauthorized';
        authIndicatorEl.textContent = 'Unauthorized: Invalid Key';
    }
});
