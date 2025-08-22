const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.usuarios;

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token) {
    return res.status(403).send({ message: "¡No se ha proporcionado ningún token!" });
  }

  if (token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "¡No autorizado!" });
    }
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user && user.rol === 'admin') {
      next();
      return;
    }
    res.status(403).send({ message: "¡Requiere rol de Administrador!" });
  } catch (error) {
    res.status(500).send({ message: "Error al verificar el rol de administrador." });
  }
};

const authJwt = {
  verifyToken,
  isAdmin
};
module.exports = authJwt;