const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // --- Rutas CRUD para Usuarios ---
  // Todas estas rutas requieren un token válido y rol de administrador

  // Crear un nuevo usuario
  app.post("/api/users", [authJwt.verifyToken, authJwt.isAdmin], controller.create);

  // Obtener todos los usuarios
  app.get("/api/users", [authJwt.verifyToken, authJwt.isAdmin], controller.findAll);

  // Actualizar un usuario por su ID
  app.put("/api/users/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.update);

  // Eliminar un usuario por su ID
  app.delete("/api/users/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.delete);
};