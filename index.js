// Servidor Express de Flamin' Bite.
// Sirve el sitio estático y expone la API REST conectada a MySQL.

const path = require('path');
const express = require('express');
const cors = require('cors');

const config = require('./config');
const pool = require('./db');

const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');
const authRouter = require('./routes/auth');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API REST ---
app.use('/api/productos', productosRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/auth', authRouter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'conectada' });
  } catch (error) {
    res.status(503).json({ ok: false, db: 'sin conexión', error: error.message });
  }
});

// --- Sitio estático ---
// Se sirven únicamente los assets del frontend. Así no se exponen
// archivos del servidor como config.js, db.js, .env o package.json.
const SITIO = __dirname;
const PAGINAS = [
  'index', 'menu', 'cart', 'checkout',
  'ubicaciones', 'about', 'contacto', 'login', 'admin', 'seguimiento',
];

app.use('/CSS', express.static(path.join(SITIO, 'CSS')));
app.use('/images', express.static(path.join(SITIO, 'images')));
app.use('/JS', express.static(path.join(SITIO, 'JS')));

app.get('/', (req, res) => res.sendFile(path.join(SITIO, 'index.html')));

PAGINAS.forEach((pagina) => {
  app.get(`/${pagina}.html`, (req, res) => {
    res.sendFile(path.join(SITIO, `${pagina}.html`));
  });
});

// --- Manejo de rutas de API no encontradas ---
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// --- Manejo global de errores ---
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// --- Arranque ---
async function iniciar() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conexión a MySQL establecida');
  } catch (error) {
    console.error('❌ No se pudo conectar a MySQL:', error.message);
    console.error('   Revisa tu archivo .env y que el servidor MySQL esté en ejecución.');
    console.error('   ¿Ya ejecutaste el esquema? -> mysql -u root -p < database/schema.sql');
    process.exit(1);
  }

  app.listen(config.puerto, () => {
    console.log(`🔥 Flamin' Bite disponible en http://localhost:${config.puerto}`);
  });
}

iniciar();
