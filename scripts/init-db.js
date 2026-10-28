// Inicializa la base de datos ejecutando database/schema.sql.
//
//   npm run db:init
//
// Usa las credenciales del archivo .env. No requiere el cliente mysql
// instalado ni en el PATH.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

(async () => {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ No se encontró el archivo:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  let conexion;
  try {
    // Nos conectamos sin especificar base de datos porque el script la crea.
    conexion = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      multipleStatements: true,
    });

    console.log(`⏳ Ejecutando el esquema en ${config.db.host}:${config.db.port} ...`);
    await conexion.query(sql);
    console.log(`✅ Base de datos "${config.db.database}" creada/actualizada correctamente.`);
    console.log('   Usuario admin por defecto: admin / 12345');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    console.error('   Revisa las credenciales de MySQL en tu archivo .env.');
    process.exitCode = 1;
  } finally {
    if (conexion) await conexion.end();
  }
})();
