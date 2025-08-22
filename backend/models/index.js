const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
    logging: false
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importar modelos
db.clientes = require('./cliente.modelo')(sequelize, DataTypes);
db.proyectos = require('./proyecto.modelo.js')(sequelize, DataTypes);
db.objetivos = require('./objetivo.modelo')(sequelize, DataTypes);
db.servicios = require('./servicio.modelo')(sequelize, DataTypes);
db.funcionalidades = require('./funcionalidad.modelo')(sequelize, DataTypes);
db.propuesta = require('./propuesta.modelo')(sequelize, DataTypes);
db.usuarios = require("./user.model.js")(sequelize, Sequelize);

// Relaciones
db.clientes.hasMany(db.proyectos, { as: 'proyectos', foreignKey: 'cliente_id', onDelete: 'CASCADE' });
db.proyectos.belongsTo(db.clientes, { as: 'cliente', foreignKey: 'cliente_id' });

db.proyectos.hasMany(db.objetivos, { foreignKey: 'proyecto_id', onDelete: 'CASCADE' });
db.proyectos.hasMany(db.servicios, { foreignKey: 'proyecto_id', onDelete: 'CASCADE' });
db.proyectos.hasMany(db.funcionalidades, { foreignKey: 'proyecto_id', onDelete: 'CASCADE' });
db.proyectos.hasOne(db.propuesta, { foreignKey: 'proyecto_id', onDelete: 'CASCADE' });

module.exports = db;
