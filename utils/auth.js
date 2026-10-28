// Utilidades de autenticación basadas en el módulo crypto de Node.
// No requieren dependencias externas.

const crypto = require('crypto');
const config = require('../config');

/**
 * Genera un hash de contraseña con scrypt.
 * Formato del resultado: "scrypt$<salt>$<hash>"
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

/**
 * Compara una contraseña en texto plano con un hash almacenado.
 */
function verifyPassword(password, stored) {
  const partes = String(stored).split('$');
  if (partes.length !== 3 || partes[0] !== 'scrypt') return false;

  const [, salt, hash] = partes;
  const candidato = crypto.scryptSync(String(password), salt, 64).toString('hex');
  const a = Buffer.from(candidato, 'hex');
  const b = Buffer.from(hash, 'hex');

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Firma un token de sesión (HMAC-SHA256). El token tiene el formato
 * "<payload en base64url>.<firma>".
 */
function signToken(payload, ttlMs = 8 * 60 * 60 * 1000) {
  const cuerpo = { ...payload, exp: Date.now() + ttlMs };
  const data = Buffer.from(JSON.stringify(cuerpo)).toString('base64url');
  const firma = crypto
    .createHmac('sha256', config.authSecret)
    .update(data)
    .digest('base64url');
  return `${data}.${firma}`;
}

/**
 * Verifica un token y devuelve su payload, o null si es inválido/expirado.
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const [data, firma] = token.split('.');
  if (!data || !firma) return null;

  const esperada = crypto
    .createHmac('sha256', config.authSecret)
    .update(data)
    .digest('base64url');

  if (
    firma.length !== esperada.length ||
    !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware que protege las rutas de administración.
 * Espera la cabecera "Authorization: Bearer <token>".
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión de nuevo.' });
  }

  req.admin = payload;
  next();
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, requireAuth };
