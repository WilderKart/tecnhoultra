const express = require('express');
const cors = require('cors');
const db = require('./models');
const rutasFormulario = require('./routes/formulario.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/formulario', rutasFormulario); // ← Ruta del formulario

db.sequelize.sync({ alter: true }).then(() => {
  console.log('Base de datos sincronizada.');
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}.`);
  });
}).catch((err) => {
  console.error('Error al sincronizar la base de datos:', err);
});
