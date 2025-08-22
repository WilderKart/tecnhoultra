module.exports = (sequelize, DataTypes) => {
  const Funcionalidad = sequelize.define("funcionalidad", {
    funcionalidad: {
      type: DataTypes.TEXT,
    }
  });

  return Funcionalidad;
};
