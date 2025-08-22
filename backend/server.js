require('dotenv').config(); // <-- Mover al inicio
const express = require('express');
const cors = require('cors');
const db = require('./models');
const path = require('path'); // 1. Importar el módulo 'path'
const rutasFormulario = require('./routes/formulario.routes');
const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS más específica para desarrollo
const corsOptions = {
  origin: ['http://localhost:3001', 'http://127.0.0.1:5500'] // Permite tu backend y Live Server
};

app.use(cors(corsOptions));

app.use(express.json());

// 2. Servir archivos estáticos desde la carpeta raíz del proyecto
// Esto permite que el navegador cargue tu archivo index.html, CSS y JS desde la raíz.
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Rutas relativas para las APIs
app.use('/api/formulario', rutasFormulario);
// Rutas de autenticación
require('./routes/auth.routes')(app);
// Rutas de gestión de usuarios (CRUD)
require('./routes/user.routes')(app);
// Rutas para el Dashboard
require('./routes/dashboard.routes')(app);

db.sequelize.sync({ alter: true }).then(() => {
  console.log('Base de datos sincronizada.');
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}.`);
  });
}).catch((err) => {
  console.error('Error al sincronizar la base de datos:', err);
});
