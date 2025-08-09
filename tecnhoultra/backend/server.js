require('dotenv').config(); // <-- Mover al inicio
const express = require('express');
const cors = require('cors');
const db = require('./models');
const path = require('path'); // 1. Importar el módulo 'path'
const rutasFormulario = require('./routes/formulario.routes');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 2. Servir archivos estáticos desde la carpeta 'frontend'
// Esto permite que el navegador cargue tus archivos HTML, CSS y JS
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/formulario', rutasFormulario);
// Rutas de autenticación
require('./routes/auth.routes')(app);
// Rutas de gestión de usuarios (CRUD)
require('./routes/user.routes')(app);

db.sequelize.sync({ alter: true }).then(() => {
  console.log('Base de datos sincronizada.');
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}.`);
  });
}).catch((err) => {
  console.error('Error al sincronizar la base de datos:', err);
});
