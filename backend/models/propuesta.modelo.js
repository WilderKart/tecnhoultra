module.exports = (sequelize, DataTypes) => {
  const Propuesta = sequelize.define("propuesta", {
    url_pdf: {
      type: DataTypes.TEXT,
    },
    estado: {
      type: DataTypes.TEXT,
      defaultValue: "enviada"
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  });

  return Propuesta;
};
