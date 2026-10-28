// Rutas relacionadas con el catálogo de productos.

const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../utils/auth');
const { normalizeProductInput } = require('../utils/product-validation');
const { normalizeProductOptionInput } = require('../utils/product-option-validation');

const router = express.Router();

/**
 * GET /api/productos
 * Devuelve todos los productos activos junto con sus opciones
 * (guarniciones, bebidas, etc.).
 */
router.get('/', async (req, res) => {
  try {
    const [productosRows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.descripcion, p.precio, p.imagen,
              c.nombre AS categoria
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE p.activo = 1
        ORDER BY p.orden, p.id`
    );

    const [opcionesRows] = await pool.query(
      `SELECT producto_id, nombre, precio, por_defecto
         FROM producto_opciones
        ORDER BY orden, id`
    );

    const productos = productosRows.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      imagen: p.imagen,
      categoria: p.categoria,
      opciones: opcionesRows
        .filter((o) => o.producto_id === p.id)
        .map((o) => ({
          nombre: o.nombre,
          precio: o.precio,
          porDefecto: Boolean(o.por_defecto),
        })),
    }));

    res.json(productos);
  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

// Gestión del catálogo desde el panel de administración. Todas estas rutas
// requieren un token válido; el GET público de abajo solo entrega productos activos.
router.get('/admin', requireAuth, async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.descripcion, p.precio, p.imagen,
              p.categoria_id, p.activo, p.orden, c.nombre AS categoria
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
        ORDER BY p.activo DESC, p.orden, p.id`
    );
    const [categorias] = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre');
    const [opciones] = await pool.query(
      `SELECT o.id, o.producto_id, o.nombre, o.precio, o.por_defecto, o.orden,
              p.codigo AS producto_codigo, p.nombre AS producto_nombre,
              c.nombre AS categoria
         FROM producto_opciones o
         JOIN productos p ON p.id = o.producto_id
         LEFT JOIN categorias c ON c.id = p.categoria_id
        ORDER BY p.orden, o.orden, o.id`
    );
    res.json({ productos, categorias, opciones });
  } catch (error) {
    console.error('Error en GET /api/productos/admin:', error);
    res.status(500).json({ error: 'Error al cargar los productos de administración' });
  }
});

function validarIdProducto(id) {
  const numero = Number(id);
  return Number.isSafeInteger(numero) && numero > 0 && String(numero) === String(id);
}

async function validarCategoria(categoriaId) {
  if (categoriaId === null) return true;
  const [rows] = await pool.query('SELECT id FROM categorias WHERE id = ?', [categoriaId]);
  return rows.length > 0;
}

router.post('/', requireAuth, async (req, res) => {
  const { value, error } = normalizeProductInput(req.body);
  if (error) return res.status(400).json({ error });

  try {
    if (!(await validarCategoria(value.categoria_id))) {
      return res.status(400).json({ error: 'La categoría seleccionada no existe.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO productos (codigo, nombre, descripcion, precio, imagen, categoria_id, activo)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [value.codigo, value.nombre, value.descripcion || null, value.precio, value.imagen || null, value.categoria_id]
    );
    res.status(201).json({ ok: true, id: resultado.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un producto con ese código.' });
    }
    console.error('Error en POST /api/productos:', error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
});

router.post('/:id/opciones', requireAuth, async (req, res) => {
  if (!validarIdProducto(req.params.id)) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }
  const { value, error } = normalizeProductOptionInput(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const productoId = Number(req.params.id);
    const [bebidas] = await pool.query(
      `SELECT p.id
         FROM productos p
         JOIN categorias c ON c.id = p.categoria_id
        WHERE p.id = ? AND p.activo = 1 AND c.nombre = 'Bebidas'`,
      [productoId]
    );
    if (bebidas.length === 0) {
      return res.status(404).json({ error: 'El producto seleccionado no es una sección activa de bebidas.' });
    }

    const [ordenRows] = await pool.query(
      'SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM producto_opciones WHERE producto_id = ?',
      [productoId]
    );
    const [resultado] = await pool.query(
      `INSERT INTO producto_opciones (producto_id, nombre, precio, por_defecto, orden)
       VALUES (?, ?, ?, 0, ?)`,
      [productoId, value.nombre, value.precio, ordenRows[0].siguiente]
    );
    res.status(201).json({ ok: true, id: resultado.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Esa bebida ya existe en esta sección.' });
    }
    console.error('Error en POST /api/productos/:id/opciones:', error);
    res.status(500).json({ error: 'Error al agregar la bebida' });
  }
});

router.delete('/:id/opciones/:opcionId', requireAuth, async (req, res) => {
  if (!validarIdProducto(req.params.id) || !validarIdProducto(req.params.opcionId)) {
    return res.status(400).json({ error: 'El identificador no es válido.' });
  }

  try {
    const productoId = Number(req.params.id);
    const [bebidas] = await pool.query(
      `SELECT p.id
         FROM productos p
         JOIN categorias c ON c.id = p.categoria_id
        WHERE p.id = ? AND c.nombre = 'Bebidas'`,
      [productoId]
    );
    if (bebidas.length === 0) {
      return res.status(404).json({ error: 'Sección de bebidas no encontrada.' });
    }

    const [resultado] = await pool.query(
      'DELETE FROM producto_opciones WHERE id = ? AND producto_id = ?',
      [Number(req.params.opcionId), productoId]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Bebida no encontrada en esta sección.' });
    }
    res.json({ ok: true, id: Number(req.params.opcionId) });
  } catch (error) {
    console.error('Error en DELETE /api/productos/:id/opciones/:opcionId:', error);
    res.status(500).json({ error: 'Error al quitar la bebida de la sección' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  if (!validarIdProducto(req.params.id)) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }
  const { value, error } = normalizeProductInput(req.body);
  if (error) return res.status(400).json({ error });

  try {
    if (!(await validarCategoria(value.categoria_id))) {
      return res.status(400).json({ error: 'La categoría seleccionada no existe.' });
    }

    const [resultado] = await pool.query(
      `UPDATE productos
          SET codigo = ?, nombre = ?, descripcion = ?, precio = ?, imagen = ?, categoria_id = ?
        WHERE id = ?`,
      [value.codigo, value.nombre, value.descripcion || null, value.precio, value.imagen || null, value.categoria_id, Number(req.params.id)]
    );
    if (resultado.affectedRows === 0) {
      const [existente] = await pool.query('SELECT id FROM productos WHERE id = ?', [Number(req.params.id)]);
      if (existente.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
    }
    res.json({ ok: true, id: Number(req.params.id) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un producto con ese código.' });
    }
    console.error('Error en PATCH /api/productos/:id:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

// Eliminar significa desactivar, no borrar físicamente: así se conserva
// la integridad de los pedidos históricos y el producto desaparece del menú.
router.delete('/:id', requireAuth, async (req, res) => {
  if (!validarIdProducto(req.params.id)) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }

  try {
    const [resultado] = await pool.query(
      'UPDATE productos SET activo = 0 WHERE id = ? AND activo = 1',
      [Number(req.params.id)]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto activo no encontrado.' });
    }
    res.json({ ok: true, id: Number(req.params.id), activo: false });
  } catch (error) {
    console.error('Error en DELETE /api/productos/:id:', error);
    res.status(500).json({ error: 'Error al desactivar el producto' });
  }
});

router.patch('/:id/estado', requireAuth, async (req, res) => {
  if (!validarIdProducto(req.params.id)) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }
  const activo = req.body?.activo;
  if (typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'El campo activo debe ser verdadero o falso.' });
  }

  try {
    const [resultado] = await pool.query(
      'UPDATE productos SET activo = ? WHERE id = ?',
      [activo ? 1 : 0, Number(req.params.id)]
    );
    if (resultado.affectedRows === 0) {
      const [existente] = await pool.query('SELECT id FROM productos WHERE id = ?', [Number(req.params.id)]);
      if (existente.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
    }
    res.json({ ok: true, id: Number(req.params.id), activo });
  } catch (error) {
    console.error('Error en PATCH /api/productos/:id/estado:', error);
    res.status(500).json({ error: 'Error al cambiar el estado del producto' });
  }
});

module.exports = router;
