const db = require('../models');
const Cliente = db.clientes;
const Proyecto = db.proyectos;

/**
 * Crea un nuevo formulario (cliente + proyecto)
 * POST /api/formulario
 */
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

    // Crear cliente
    const cliente = await Cliente.create({
      nombre_completo,
      empresa,
      correo,
      telefono,
      sitio_web_o_redes,
      fecha_creacion: new Date()
    });

    // Crear proyecto asociado
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

    res.status(201).json({ 
      mensaje: 'Formulario guardado correctamente.',
      proyecto_id: proyecto.id,
      cliente_id: cliente.id
    });
  } catch (error) {
    console.error('Error al crear formulario:', error);
    res.status(500).json({ error: 'Error al guardar el formulario.' });
  }
};

/**
 * Obtiene todos los formularios con sus clientes y proyectos
 * GET /api/formulario
 */
exports.obtenerTodos = async (req, res) => {
  try {
    const proyectos = await Proyecto.findAll({
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['id', 'nombre_completo', 'empresa', 'correo', 'telefono', 'sitio_web_o_redes']
      }],
      order: [['fecha_creacion', 'DESC']]
    });

    // Mapear a una estructura plana para facilitar el uso en el frontend
    const datos = proyectos.map(p => ({
      proyecto_id: p.id,
      cliente_id: p.cliente_id,
      nombre_completo: p.cliente.nombre_completo,
      empresa: p.cliente.empresa,
      correo: p.cliente.correo,
      telefono: p.cliente.telefono,
      sitio_web_o_redes: p.cliente.sitio_web_o_redes,
      tipo_negocio: p.tipo_negocio,
      producto_principal: p.producto_principal,
      publico_objetivo: p.publico_objetivo,
      diferencial: p.diferencial,
      rango_presupuesto: p.rango_presupuesto,
      fecha_limite: p.fecha_limite,
      comentarios: p.comentarios,
      fecha_creacion: p.fecha_creacion
    }));

    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener formularios:', error);
    res.status(500).json({ error: 'Error al obtener los datos.' });
  }
};

/**
 * Actualiza un proyecto existente
 * PUT /api/formulario/:id
 */
exports.actualizarFormulario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rango_presupuesto,
      fecha_limite,
      comentarios,
      tipo_negocio,
      producto_principal,
      publico_objetivo,
      diferencial
    } = req.body;

    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }

    // Actualizar solo los campos proporcionados
    await proyecto.update({
      rango_presupuesto: rango_presupuesto !== undefined ? rango_presupuesto : proyecto.rango_presupuesto,
      fecha_limite: fecha_limite || proyecto.fecha_limite,
      comentarios: comentarios || proyecto.comentarios,
      tipo_negocio: tipo_negocio || proyecto.tipo_negocio,
      producto_principal: producto_principal || proyecto.producto_principal,
      publico_objetivo: publico_objetivo || proyecto.publico_objetivo,
      diferencial: diferencial || proyecto.diferencial
    });

    res.status(200).json({ mensaje: 'Proyecto actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ error: 'Error al actualizar el proyecto.' });
  }
};

/**
 * Elimina un proyecto (y su cliente se queda, pero puedes ajustar esto)
 * DELETE /api/formulario/:id
 */
exports.eliminarFormulario = async (req, res) => {
  try {
    const { id } = req.params;

    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }

    // Eliminar el proyecto
    await proyecto.destroy();

    res.status(200).json({ mensaje: 'Proyecto eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto.' });
  }
};