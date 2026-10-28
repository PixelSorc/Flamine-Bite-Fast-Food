const crypto = require('crypto');

const ORDER_STATES = [
  'pendiente',
  'preparacion',
  'listo',
  'en_camino',
  'enviado', // Compatibilidad con pedidos creados antes del seguimiento.
  'entregado',
  'cancelado',
];

function createTrackingCode() {
  return `FB-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

function isTrackingCode(value) {
  return /^FB-[A-F0-9]{24}$/.test(String(value || ''));
}

function publicOrderState(state) {
  if (state === 'enviado') return 'en_camino';
  if (state === 'pendiente') return 'preparacion';
  return state;
}

module.exports = { ORDER_STATES, createTrackingCode, isTrackingCode, publicOrderState };
