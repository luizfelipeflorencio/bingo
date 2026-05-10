const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
});

const statusEl = document.getElementById('status');
const currentNumberEl = document.getElementById('current-number');
const numbersListEl = document.getElementById('numbers-list');

// UI State handling
function updateStatus(state) {
    statusEl.textContent = state;
    statusEl.className = state.toLowerCase().split(' ')[0];
}

socket.on('connect', () => {
    console.log('Connected to server');
    updateStatus('Connected');
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    updateStatus('Disconnected (Reconnecting...)');
});

socket.on('connect_error', () => {
    updateStatus('Connection Error');
});

// Pitfall 1 & 2: SYNC handle
socket.on('sync', (state) => {
    console.log('Received SYNC:', state);
    renderState(state);
});

// Real-time updates
socket.on('numberDrawn', (number) => {
    console.log('Number drawn:', number);
    currentNumberEl.textContent = number;

    // Add to history if not present
    const history = Array.from(document.querySelectorAll('.history-number')).map(el => parseInt(el.textContent));
    if (!history.includes(number)) {
        addNumberToHistory(number);
    }
});

function renderState(state) {
    currentNumberEl.textContent = state.lastDrawn || '--';
    numbersListEl.innerHTML = '';
    state.drawnNumbers.forEach(num => addNumberToHistory(num));
}

function addNumberToHistory(num) {
    const el = document.createElement('span');
    el.className = 'history-number';
    el.textContent = num;
    numbersListEl.appendChild(el);
}
