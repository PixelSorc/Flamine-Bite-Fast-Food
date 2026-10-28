const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCatalogSync() {
  const windowListeners = new Map();
  let channelMessage = null;
  let channelListener = null;
  const channel = {
    addEventListener: (name, callback) => { if (name === 'message') channelListener = callback; },
    postMessage: (message) => { channelMessage = message; },
  };
  class FakeBroadcastChannel {
    constructor(name) { this.name = name; channel.name = name; return channel; }
  }
  const window = {
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    dispatchEvent: (event) => windowListeners.get(event.type)?.(event),
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'JS', 'catalog-sync.js'), 'utf8');
  vm.runInNewContext(source, {
    window,
    BroadcastChannel: FakeBroadcastChannel,
    Event: class { constructor(type) { this.type = type; } },
    localStorage: { setItem() {} },
  });
  return { window, channel, getChannelMessage: () => channelMessage, getChannelListener: () => channelListener };
}

test('publica un aviso cuando se modifica el catálogo', () => {
  const sync = loadCatalogSync();
  sync.window.notifyCatalogUpdated();
  assert.equal(sync.channel.name, 'flamin-bite-catalog');
  assert.deepEqual(JSON.parse(JSON.stringify(sync.getChannelMessage())), { type: 'catalog-updated' });
});

test('notifica a la página del menú cuando otra pestaña cambia el catálogo', () => {
  const sync = loadCatalogSync();
  let updates = 0;
  sync.window.onCatalogUpdated(() => { updates += 1; });
  sync.getChannelListener()({ data: { type: 'catalog-updated' } });
  assert.equal(updates, 1);
});
