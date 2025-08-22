const controller = require("../controllers/auth.controller");
const { check } = require('express-validator');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/auth/signup", [
      check('correo', 'El correo no es válido').isEmail(),
      check('contrasena', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 })
  ], controller.signup);

  app.post("/api/auth/signin", controller.signin);
};

