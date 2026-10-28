const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProductOptionInput } = require('../utils/product-option-validation');

test('normaliza una bebida y valida su precio', () => {
  const result = normalizeProductOptionInput({ nombre: '  Gaseosa de cola  ', precio: '4500' });

  assert.equal(result.error, null);
  assert.deepEqual(result.value, { nombre: 'Gaseosa de cola', precio: 4500 });
});

test('rechaza nombres vacíos y precios inválidos para opciones', () => {
  assert.match(normalizeProductOptionInput({ nombre: ' ', precio: 4000 }).error, /nombre/i);
  assert.match(normalizeProductOptionInput({ nombre: 'Agua', precio: 0 }).error, /precio/i);
});
