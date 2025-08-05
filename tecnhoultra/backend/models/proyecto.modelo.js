module.exports = (sequelize, DataTypes) => {
  const Proyecto = sequelize.define("proyecto", {
    tipo_negocio: {
      type: DataTypes.TEXT,
    },
    producto_principal: {
      type: DataTypes.TEXT,
    },
    publico_objetivo: {
      type: DataTypes.TEXT,
    },
    diferencial: {
      type: DataTypes.TEXT,
    },
    rango_presupuesto: {
      type: DataTypes.TEXT,
    },
    fecha_limite: {
      type: DataTypes.DATE,
    },
    comentarios: {
      type: DataTypes.TEXT,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  });

  return Proyecto;
};
