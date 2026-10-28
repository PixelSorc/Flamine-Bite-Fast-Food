// Configuración central del servidor.
// Lee las variables de entorno desde un archivo .env (si existe) sin
// depender de paquetes externos como dotenv.

const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const contenido = fs.readFileSync(envPath, 'utf8');
  contenido.split(/\r?\n/).forEach((linea) => {
    const match = linea.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) return;

    const key = match[1];
    let value = (match[2] || '').trim();
    // Quita comillas simples o dobles que envuelvan el valor.
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
      value = value.slice(1, -1);
    }
    // Las variables ya definidas en el sistema tienen prioridad.
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

module.exports = {
  puerto: Number(process.env.PORT) || 3000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flamine_bite',
  },

  // Clave usada para firmar los tokens de sesión del administrador.
  // ¡Cámbiala en producción!
  authSecret: process.env.AUTH_SECRET || 'flamin-bite-clave-secreta-cambiar',

  // Costo de envío fijo (en pesos colombianos).
  costoEnvio: Number(process.env.DELIVERY_COST) || 2000,
};
