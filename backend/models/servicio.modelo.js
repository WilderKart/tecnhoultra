module.exports = (sequelize, DataTypes) => {
  const Servicio = sequelize.define("servicio", {
    servicio: {
      type: DataTypes.TEXT,
    }
  });

  return Servicio;
};
