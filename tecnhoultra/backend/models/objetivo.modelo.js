module.exports = (sequelize, DataTypes) => {
  const Objetivo = sequelize.define("objetivo", {
    objetivo: {
      type: DataTypes.TEXT,
    }
  });

  return Objetivo;
};
