module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("usuario", {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    contrasena: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rol: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    }
  });

  return User;
};
