// Genera un hash scrypt para almacenar contraseñas de administrador.
//
//   node scripts/hash-password.js "mi-contrasena"
//
// Copia el resultado en la columna administradores.password_hash
// (o ejecuta el UPDATE que imprime el script).

const { hashPassword } = require('../utils/auth');

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/hash-password.js "<contraseña>"');
  process.exit(1);
}

const hash = hashPassword(password);

console.log('\nHash generado:\n');
console.log(hash);
console.log('\nPara actualizar la contraseña del admin en MySQL:\n');
console.log(`  UPDATE administradores SET password_hash = '${hash}' WHERE usuario = 'admin';\n`);
