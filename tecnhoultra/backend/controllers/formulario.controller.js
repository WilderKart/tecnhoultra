const db = require('../models');
const Cliente = db.clientes;
const Proyecto = db.proyectos;

exports.crearFormulario = async (req, res) => {
  try {
    const {
      nombre_completo,
      empresa,
      correo,
      telefono,
      sitio_web_o_redes,
      tipo_negocio,
      producto_principal,
      publico_objetivo,
      diferencial,
      rango_presupuesto,
      fecha_limite,
      comentarios
    } = req.body;

    const cliente = await Cliente.create({
      nombre_completo,
      empresa,
      correo,
      telefono,
      sitio_web_o_redes,
      fecha_creacion: new Date()
    });

    const proyecto = await Proyecto.create({
      tipo_negocio,
      producto_principal,
      publico_objetivo,
      diferencial,
      rango_presupuesto,
      fecha_limite,
      comentarios,
      fecha_creacion: new Date(),
      cliente_id: cliente.id
    });

    res.status(201).json({ mensaje: 'Formulario guardado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el formulario.' });
  }
};
