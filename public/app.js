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

// LocalStorage Persistence
const STORAGE_KEY = 'bingo_game_state';

function saveToLocal(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadFromLocal() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
}

// Initial hydration (Optimistic UX)
const localState = loadFromLocal();
if (localState) {
    console.log('Hydrating from LocalStorage:', localState);
    renderState(localState);
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
socket.on('SYNC', (state) => {
    console.log('Received SYNC (Server Authority):', state);
    renderState(state);
    saveToLocal(state); // Unconditionally overwrite local cache
});

// Real-time updates
socket.on('numberDrawn', (number) => {
    console.log('Number drawn:', number);
    currentNumberEl.textContent = number;

    // Add to history if not present
    const history = Array.from(document.querySelectorAll('.history-number')).map(el => parseInt(el.textContent));
    if (!history.includes(number)) {
        addNumberToHistory(number);

        // Update local cache
        const currentState = loadFromLocal() || { drawnNumbers: [], lastDrawn: null };
        currentState.lastDrawn = number;
        if (!currentState.drawnNumbers.includes(number)) {
            currentState.drawnNumbers.push(number);
        }
        saveToLocal(currentState);
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
