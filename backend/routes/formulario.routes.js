const express = require('express');
const router = express.Router();
const controlador = require('../controllers/formulario.controller');
const { authJwt } = require('../middleware');

// Ruta pública para que cualquiera pueda enviar el formulario
router.post('/', controlador.crearFormulario);

// Rutas protegidas que solo un admin puede acceder
router.get('/', [authJwt.verifyToken, authJwt.isAdmin], controlador.obtenerTodos);
router.get('/:id', [authJwt.verifyToken, authJwt.isAdmin], controlador.obtenerPorId);
router.put('/:id', [authJwt.verifyToken, authJwt.isAdmin], controlador.actualizarFormulario);
router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], controlador.eliminarFormulario);

module.exports = router;