const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ORDER_STATES,
  createTrackingCode,
  isTrackingCode,
  publicOrderState,
} = require('../utils/order-tracking');

test('incluye los estados de preparación, listo y en camino', () => {
  assert.ok(ORDER_STATES.includes('preparacion'));
  assert.ok(ORDER_STATES.includes('listo'));
  assert.ok(ORDER_STATES.includes('en_camino'));
});

test('genera un código de seguimiento opaco y válido', () => {
  const code = createTrackingCode();
  assert.match(code, /^FB-[A-F0-9]{24}$/);
  assert.equal(isTrackingCode(code), true);
  assert.notEqual(code, createTrackingCode());
});

test('normaliza el estado antiguo enviado a en camino', () => {
  assert.equal(publicOrderState('enviado'), 'en_camino');
  assert.equal(publicOrderState('pendiente'), 'preparacion');
  assert.equal(publicOrderState('listo'), 'listo');
});

test('no permite buscar con el formato antiguo y predecible de pedido', () => {
  assert.equal(isTrackingCode('order-1730000000000'), false);
  assert.equal(isTrackingCode('FB-123'), false);
});
