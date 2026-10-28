const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProductInput } = require('../utils/product-validation');

test('normaliza y acepta un producto válido', () => {
  const result = normalizeProductInput({
    codigo: ' prod-010 ',
    nombre: '  Hamburguesa nueva  ',
    descripcion: ' Prueba ',
    precio: '12500',
    imagen: 'images/nueva.png',
    categoria_id: '2',
  });

  assert.equal(result.error, null);
  assert.deepEqual(result.value, {
    codigo: 'prod-010',
    nombre: 'Hamburguesa nueva',
    descripcion: 'Prueba',
    precio: 12500,
    imagen: 'images/nueva.png',
    categoria_id: 2,
  });
});

test('rechaza códigos inválidos y precios no positivos', () => {
  const base = {
    codigo: 'prod-010',
    nombre: 'Producto',
    precio: 1000,
  };

  assert.match(normalizeProductInput({ ...base, codigo: 'código con espacios' }).error, /código/i);
  assert.match(normalizeProductInput({ ...base, precio: 0 }).error, /precio/i);
  assert.match(normalizeProductInput({ ...base, precio: 'no-numérico' }).error, /precio/i);
});
