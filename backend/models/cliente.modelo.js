module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define("cliente", {
    nombre_completo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    empresa: {
      type: DataTypes.TEXT,
    },
    correo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    telefono: {
      type: DataTypes.TEXT,
    },
    sitio_web_o_redes: {
      type: DataTypes.TEXT,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  });

  return Cliente;
};
