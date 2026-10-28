// Ejecuta la migración aditiva para los estados de seguimiento de pedidos.
// Antes de correrla en una base con pedidos reales, crea una copia de seguridad.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

(async () => {
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_order_tracking_statuses.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('No se encontró la migración:', migrationPath);
    process.exitCode = 1;
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      multipleStatements: true,
    });
    console.log(`Aplicando seguimiento de pedidos a la base "${config.db.database}"...`);
    await connection.query(sql);
    console.log('Migración aplicada. Ya puedes usar los estados de seguimiento.');
  } catch (error) {
    console.error('No se pudo aplicar la migración:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
})();
