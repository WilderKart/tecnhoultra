const bcrypt = require('bcryptjs');

const password = 'Kevin330#'; // <-- CAMBIA ESTO por una contraseña fuerte
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Tu contraseña hasheada es:');
console.log(hash);

// Este script ahora es síncrono, lo que es más simple para este caso de uso.
// Simplemente genera el hash y lo imprime.
