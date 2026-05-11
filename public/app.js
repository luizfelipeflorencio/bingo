const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
});

const statusEl = document.getElementById('status');
const currentNumberEl = document.getElementById('current-number');
const gridContainerEl = document.getElementById('grid-container');
const historyStripEl = document.getElementById('history-strip');

// UI State handling
function updateStatus(state) {
    statusEl.textContent = state;
    statusEl.className = state.toLowerCase().split(' ')[0];
}

// LocalStorage Persistence
const STORAGE_KEY = 'bingo_game_state';

function saveToLocal(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.error('Failed to save to local storage:', err);
    }
}

function loadFromLocal() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (err) {
        console.error('Failed to load from local storage:', err);
        return null;
    }
}

// Version check for state sync
function isStateNewer(newState, oldState) {
    if (!oldState) return true;
    // Simple version check: more numbers drawn = newer
    return (newState.drawnNumbers || []).length >= (oldState.drawnNumbers || []).length;
}

// D-02: Grid Generation
function generateGrid() {
    gridContainerEl.innerHTML = '';
    for (let i = 1; i <= 90; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.id = `cell-${i}`;
        cell.textContent = i;
        gridContainerEl.appendChild(cell);
    }
}

// D-03: History Slicing (Latest 5 excluding current)
function updateHistoryStrip(drawnNumbers) {
    historyStripEl.innerHTML = '';
    if (drawnNumbers.length <= 1) return;

    // Get last 6 numbers, then take all but the very last one
    const latest = drawnNumbers.slice(-6, -1).reverse();

    latest.forEach(num => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = num;
        historyStripEl.appendChild(item);
    });
}

// D-04: Pulse & Flash Trigger
function triggerAnimation(number) {
    const cell = document.getElementById(`cell-${number}`);

    // Remove classes to re-trigger if needed
    currentNumberEl.classList.remove('animate-pulse-flash');
    if (cell) cell.classList.remove('animate-pulse-flash');

    // Trigger reflow
    void currentNumberEl.offsetWidth;

    currentNumberEl.classList.add('animate-pulse-flash');
    if (cell) cell.classList.add('animate-pulse-flash');
}

// Initial Setup
generateGrid();

const localState = loadFromLocal();
if (localState) {
    renderState(localState);
}

socket.on('connect', () => {
    updateStatus('Connected');
});

socket.on('disconnect', () => {
    updateStatus('Disconnected (Reconnecting...)');
});

socket.on('SYNC', (state) => {
    const localState = loadFromLocal();
    if (isStateNewer(state, localState)) {
        renderState(state);
        saveToLocal(state);
    }
});

socket.on('numberDrawn', (number) => {
    const state = loadFromLocal() || { drawnNumbers: [], lastDrawn: null };

    if (!state.drawnNumbers.includes(number)) {
        state.drawnNumbers.push(number);
        state.lastDrawn = number;
        renderState(state);
        saveToLocal(state);
        triggerAnimation(number);
    }
});

function renderState(state) {
    // D-05: Empty State Handling
    if (!state.lastDrawn && (!state.drawnNumbers || state.drawnNumbers.length === 0)) {
        currentNumberEl.textContent = 'Waiting for game to start...';
        currentNumberEl.classList.add('empty-state');
    } else {
        currentNumberEl.textContent = state.lastDrawn;
        currentNumberEl.classList.remove('empty-state');
    }

    // Reset grid highlights
    document.querySelectorAll('.grid-cell').forEach(cell => cell.classList.remove('drawn'));

    // Apply highlights
    state.drawnNumbers.forEach(num => {
        const cell = document.getElementById(`cell-${num}`);
        if (cell) cell.classList.add('drawn');
    });

    updateHistoryStrip(state.drawnNumbers);
}

