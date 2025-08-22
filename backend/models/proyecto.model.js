module.exports = (sequelize, DataTypes) => {
  const Proyecto = sequelize.define("proyecto", {
    // --- CAMPO FALTANTE ---
    // Asegúrate de que este campo exista. El tipo de dato puede variar.
    // DECIMAL es bueno para dinero.
    presupuesto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    // --- Otros campos que tu modelo probablemente ya tiene ---
    producto_principal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tipo_negocio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fecha_limite: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // ... aquí irían otros campos de tu tabla proyectos
  });

  return Proyecto;
};