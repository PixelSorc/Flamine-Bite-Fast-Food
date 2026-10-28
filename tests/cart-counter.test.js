const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('el contador se actualiza al recibir cart:updated sin recargar la página', () => {
  let cart = [{ quantity: 1 }];
  const listeners = {};
  const attributes = {};
  const counter = {
    textContent: '',
    closest: () => ({
      setAttribute: (name, value) => { attributes[name] = value; },
      classList: { toggle() {} },
    }),
  };
  const context = {
    document: { readyState: 'complete', querySelectorAll: () => [counter] },
    window: { addEventListener: (name, handler) => { listeners[name] = handler; } },
    localStorage: { getItem: () => JSON.stringify(cart) },
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'JS', 'cart-counter.js'), 'utf8');

  vm.runInNewContext(source, context);
  assert.equal(counter.textContent, 1);

  cart = [{ quantity: 3 }];
  assert.equal(typeof listeners['cart:updated'], 'function');
  listeners['cart:updated']();

  assert.equal(counter.textContent, 3);
  assert.equal(attributes['aria-label'], 'Carrito de compras: 3 productos');
});
