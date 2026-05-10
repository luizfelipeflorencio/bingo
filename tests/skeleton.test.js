const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Skeleton UI files exist', (t) => {
  const publicDir = path.join(__dirname, '..', 'public');
  assert.ok(fs.existsSync(path.join(publicDir, 'index.html')), 'index.html should exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'app.js')), 'app.js should exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'style.css')), 'style.css should exist');
});

test('index.html contains socket.io and app.js links', (t) => {
  const indexContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  assert.ok(indexContent.includes('socket.io/socket.io.js'), 'should link to socket.io client');
  assert.ok(indexContent.includes('app.js'), 'should link to app.js');
});

test('app.js contains connection logic', (t) => {
  const appContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
  assert.ok(appContent.includes('io('), 'should initialize socket.io');
  assert.ok(appContent.includes('status'), 'should handle status UI');
});
