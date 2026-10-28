// Rutas de autenticación del administrador.

const express = require('express');
const pool = require('../db');
const { verifyPassword, signToken } = require('../utils/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Devuelve un token de sesión si las credenciales son correctas.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, usuario, password_hash, nombre FROM administradores WHERE usuario = ?',
      [username]
    );

    const admin = rows[0];
    // Se verifica la contraseña incluso si el usuario no existe para evitar
    // filtrar qué usuarios son válidos por diferencias de tiempo.
    const valido = admin
      ? verifyPassword(password, admin.password_hash)
      : verifyPassword(password, 'scrypt$00$00');

    if (!admin || !valido) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = signToken({ id: admin.id, usuario: admin.usuario });
    res.json({ ok: true, token, usuario: admin.usuario, nombre: admin.nombre });
  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

module.exports = router;
