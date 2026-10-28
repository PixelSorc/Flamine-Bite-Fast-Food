// Rutas para la creación y gestión de pedidos.

const express = require('express');
const pool = require('../db');
const config = require('../config');
const { requireAuth } = require('../utils/auth');
const { ORDER_STATES, createTrackingCode, isTrackingCode, publicOrderState } = require('../utils/order-tracking');

const router = express.Router();

/**
 * Calcula el precio real de un ítem a partir de los datos en la base de
 * datos (nunca confía en el precio enviado por el cliente).
 * Devuelve null si el producto no existe o no está activo.
 */
async function resolverItem(item) {
  const [prodRows] = await pool.query(
    'SELECT id, codigo, nombre, precio FROM productos WHERE codigo = ? AND activo = 1',
    [item.codigo]
  );

  const producto = prodRows[0];
  if (!producto) return null;

  let nombre = producto.nombre;
  let precio = producto.precio;
  let opcion = null;

  if (item.opcion) {
    const [optRows] = await pool.query(
      'SELECT nombre, precio FROM producto_opciones WHERE producto_id = ? AND nombre = ?',
      [producto.id, item.opcion]
    );
    if (optRows[0]) {
      nombre = optRows[0].nombre;
      precio = optRows[0].precio;
      opcion = optRows[0].nombre;
    }
  }

  const cantidad = Math.max(1, parseInt(item.cantidad, 10) || 1);

  return {
    producto_codigo: producto.codigo,
    nombre,
    opcion,
    precio_unitario: precio,
    cantidad,
    subtotal: precio * cantidad,
  };
}

/**
 * POST /api/pedidos  (público)
 * Body: { customer_name, customer_address, customer_email, customer_phone,
 *         metodo_pago, items: [{ codigo, opcion, cantidad }] }
 */
router.post('/', async (req, res) => {
  const {
    customer_name,
    customer_address,
    customer_email,
    customer_phone,
    metodo_pago,
    items,
  } = req.body || {};

  if (!customer_name || !String(customer_name).trim()) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido no contiene productos' });
  }

  const conexion = await pool.getConnection();
  try {
    // Resolver y validar cada ítem con los precios de la base de datos.
    const itemsResueltos = [];
    for (const item of items) {
      if (!item || !item.codigo) {
        return res.status(400).json({ error: 'Cada ítem debe incluir su código de producto' });
      }
      const resuelto = await resolverItem(item);
      if (!resuelto) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.codigo}` });
      }
      itemsResueltos.push(resuelto);
    }

    const subtotal = itemsResueltos.reduce((acc, i) => acc + i.subtotal, 0);
    const costoEnvio = config.costoEnvio;
    const total = subtotal + costoEnvio;
    const codigo = createTrackingCode();

    await conexion.beginTransaction();

    const [resultado] = await conexion.query(
      `INSERT INTO pedidos
        (codigo, cliente_nombre, cliente_direccion, cliente_email, cliente_telefono,
         metodo_pago, subtotal, costo_envio, total, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'preparacion')`,
      [
        codigo,
        String(customer_name).trim(),
        customer_address || null,
        customer_email || null,
        customer_phone || null,
        metodo_pago || null,
        subtotal,
        costoEnvio,
        total,
      ]
    );

    const pedidoId = resultado.insertId;

    for (const i of itemsResueltos) {
      await conexion.query(
        `INSERT INTO pedido_items
          (pedido_id, producto_codigo, nombre, opcion, precio_unitario, cantidad, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pedidoId, i.producto_codigo, i.nombre, i.opcion, i.precio_unitario, i.cantidad, i.subtotal]
      );
    }

    await conexion.commit();

    res.status(201).json({
      ok: true,
      pedido: {
        id: pedidoId,
        codigo,
        subtotal,
        costo_envio: costoEnvio,
        total,
        estado: 'preparacion',
      },
    });
  } catch (error) {
    await conexion.rollback();
    console.error('Error en POST /api/pedidos:', error);
    res.status(500).json({ error: 'Error al registrar el pedido' });
  } finally {
    conexion.release();
  }
});

// Seguimiento público mediante un código opaco de 96 bits. Solo devuelve estado y fecha,
// nunca datos personales ni los productos del pedido.
router.get('/seguimiento/:codigo', async (req, res) => {
  const codigo = String(req.params.codigo || '').toUpperCase();
  if (!isTrackingCode(codigo)) {
    return res.status(404).json({ error: 'No encontramos ese pedido.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT codigo, estado, creado_en FROM pedidos WHERE codigo = ?',
      [codigo]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No encontramos ese pedido.' });
    }

    res.set('Cache-Control', 'no-store');
    res.json({
      codigo: rows[0].codigo,
      estado: publicOrderState(rows[0].estado),
      creado_en: rows[0].creado_en,
    });
  } catch (error) {
    console.error('Error en GET /api/pedidos/seguimiento/:codigo:', error);
    res.status(500).json({ error: 'No se pudo consultar el estado del pedido.' });
  }
});

/**
 * GET /api/pedidos?estado=pendiente,preparacion,listo,en_camino  (requiere autenticación)
 * Lista los pedidos con sus ítems.
 */
router.get('/', requireAuth, async (req, res) => {
  const { estado } = req.query;

  try {
    const params = [];
    let sql = `SELECT id, codigo, cliente_nombre, cliente_direccion, cliente_email,
                      cliente_telefono, metodo_pago, subtotal, costo_envio, total,
                      estado, creado_en
                 FROM pedidos`;

    if (estado) {
      const estados = String(estado).split(',').map((value) => value.trim()).filter((value) => ORDER_STATES.includes(value));
      if (estados.length === 0) {
        return res.status(400).json({ error: `Estado inválido. Usa: ${ORDER_STATES.join(', ')}` });
      }
      sql += ' WHERE estado IN (?)';
      params.push(estados);
    }
    sql += ' ORDER BY creado_en DESC';

    const [pedidos] = await pool.query(sql, params);

    if (pedidos.length === 0) {
      return res.json([]);
    }

    const ids = pedidos.map((p) => p.id);
    const [items] = await pool.query(
      `SELECT pedido_id, producto_codigo, nombre, opcion, precio_unitario, cantidad, subtotal
         FROM pedido_items
        WHERE pedido_id IN (?)`,
      [ids]
    );

    const respuesta = pedidos.map((p) => ({
      ...p,
      items: items.filter((i) => i.pedido_id === p.id),
    }));

    res.json(respuesta);
  } catch (error) {
    console.error('Error en GET /api/pedidos:', error);
    res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
});

/**
 * PATCH /api/pedidos/:id/estado  (requiere autenticación)
 * Body: { estado }
 */
router.patch('/:id/estado', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body || {};

  if (!ORDER_STATES.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Usa: ${ORDER_STATES.join(', ')}` });
  }

  try {
    const [resultado] = await pool.query(
      'UPDATE pedidos SET estado = ? WHERE id = ?',
      [estado, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ ok: true, id: Number(id), estado });
  } catch (error) {
    console.error('Error en PATCH /api/pedidos/:id/estado:', error);
    res.status(500).json({ error: 'Error al actualizar el pedido' });
  }
});

module.exports = router;
