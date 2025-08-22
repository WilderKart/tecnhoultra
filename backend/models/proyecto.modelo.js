module.exports = (sequelize, DataTypes) => {
  const Proyecto = sequelize.define("proyecto", {
    tipo_negocio: {
      type: DataTypes.TEXT,
    },
    producto_principal: {
      type: DataTypes.TEXT,
      allowNull: false // Un proyecto debe tener un producto o servicio principal.
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
    // Campo numérico para poder hacer cálculos (AVG, SUM, etc.)
    presupuesto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
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
