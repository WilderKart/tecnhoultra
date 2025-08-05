const express = require('express');
const router = express.Router();
const controlador = require('../controllers/formulario.controller');

router.post('/', controlador.crearFormulario);

module.exports = router;