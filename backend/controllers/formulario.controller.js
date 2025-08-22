const db = require('../models');
const Cliente = db.clientes;
const Proyecto = db.proyectos;
const { Op } = db.Sequelize;

// Helper para convertir el rango de texto a un número para análisis
const parsePresupuesto = (rango) => {
  if (!rango) return null;
  // Elimina '$', ',', '+' y espacios, luego toma el primer número encontrado
  // Se convierte a String() para manejar de forma segura tanto números como texto.
  const cleanedString = String(rango).replace(/[$,+]/g, '').trim();
  const match = cleanedString.match(/\d+/);
  return match ? parseFloat(match[0]) : null;
};

/**
 * Crea un nuevo formulario (cliente + proyecto)
 * POST /api/formulario
 */
exports.crearFormulario = async (req, res) => {
  const t = await db.sequelize.transaction();
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

    // --- VALIDACIÓN DE CAMPOS OBLIGATORIOS ---
    if (!nombre_completo || !correo || !producto_principal) {
      return res.status(400).json({ 
        error: 'Los campos Nombre, Correo y Producto Principal son obligatorios.' 
      });
    }

    // Crear cliente
    const cliente = await Cliente.create({
      nombre_completo,
      empresa,
      correo,
      telefono,
      sitio_web_o_redes,
      fecha_creacion: new Date()
    }, { transaction: t });

    // Crear proyecto asociado
    const proyecto = await Proyecto.create({
      tipo_negocio,
      producto_principal,
      publico_objetivo,
      diferencial,
      presupuesto: parsePresupuesto(rango_presupuesto), // Campo numérico para análisis
      rango_presupuesto,
      fecha_limite,
      comentarios,
      fecha_creacion: new Date(),
      cliente_id: cliente.id
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ 
      mensaje: 'Formulario guardado correctamente.',
      proyecto_id: proyecto.id,
      cliente_id: cliente.id
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear formulario:', error);
    // En desarrollo, envía el error real para facilitar la depuración.
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Error al guardar el formulario.';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * Obtiene todos los formularios con sus clientes y proyectos
 * GET /api/formulario
 */
exports.obtenerTodos = async (req, res) => {
  try {
    // Parámetros para paginación y búsqueda
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // 10 registros por página
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    let whereClause = {};
    if (searchTerm) {
      whereClause = {
        [Op.or]: [
          // Búsqueda insensible a mayúsculas en el modelo de Cliente asociado
          { '$cliente.nombre_completo$': { [Op.iLike]: `%${searchTerm}%` } },
          { '$cliente.correo$': { [Op.iLike]: `%${searchTerm}%` } },
          { '$cliente.telefono$': { [Op.iLike]: `%${searchTerm}%` } },
        ]
      };
    }

    const { count, rows: proyectos } = await Proyecto.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['id', 'nombre_completo', 'empresa', 'correo', 'telefono', 'sitio_web_o_redes']
      }],
      order: [['fecha_creacion', 'DESC']],
      distinct: true // Importante para un conteo correcto al usar 'include'
    });

    // Mapear a una estructura plana para facilitar el uso en el frontend
    const datos = proyectos.map(p => ({
      proyecto_id: p.id,
      cliente_id: p.cliente_id,
      nombre_completo: p.cliente ? p.cliente.nombre_completo : 'Sin cliente',
      empresa: p.cliente ? p.cliente.empresa : '',
      correo: p.cliente ? p.cliente.correo : '',
      telefono: p.cliente ? p.cliente.telefono : '',
      sitio_web_o_redes: p.cliente ? p.cliente.sitio_web_o_redes : '',
      tipo_negocio: p.tipo_negocio,
      producto_principal: p.producto_principal,
      publico_objetivo: p.publico_objetivo,
      diferencial: p.diferencial,
      rango_presupuesto: p.rango_presupuesto,
      fecha_limite: p.fecha_limite,
      comentarios: p.comentarios,
      fecha_creacion: p.fecha_creacion
    }));

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: datos
    });

  } catch (error) {
    console.error('Error al obtener formularios:', error);
    res.status(500).json({ error: 'Error al obtener los datos.' });
  }
};

/**
 * Obtiene un formulario por su ID de proyecto
 * GET /api/formulario/:id
 */
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n--- [DEBUG] Iniciando obtenerPorId ---`);
    console.log(`[DEBUG] Recibido ID de proyecto para buscar: ${id}`);

    // Paso 1: Encontrar el proyecto por su ID.
    const proyecto = await Proyecto.findByPk(id);

    if (!proyecto) {
      console.error(`[DEBUG] FALLO: No se encontró ningún proyecto con el ID ${id} en la base de datos.`);
      console.log(`--- [DEBUG] Fin obtenerPorId ---\n`);
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }

    console.log(`[DEBUG] ÉXITO: Proyecto encontrado. Datos:`, JSON.stringify(proyecto, null, 2));
    console.log(`[DEBUG] El ID del cliente asociado es: ${proyecto.cliente_id}`);

    // Paso 2: Encontrar el cliente asociado usando el cliente_id del proyecto.
    const cliente = await Cliente.findByPk(proyecto.cliente_id);
    if (!cliente) {
      // Esto puede pasar si el cliente fue eliminado pero el proyecto no.
      console.error(`[DEBUG] FALLO: Se encontró el proyecto, pero no su cliente asociado con ID ${proyecto.cliente_id}.`);
      console.log(`--- [DEBUG] Fin obtenerPorId ---\n`);
      return res.status(404).json({ error: 'No se encontró el cliente asociado a esta solicitud. Los datos pueden estar corruptos.' });
    }

    console.log(`[DEBUG] ÉXITO: Cliente asociado encontrado. Datos:`, JSON.stringify(cliente, null, 2));
    // Paso 3: Combinamos manualmente los datos en el formato que el frontend espera.
    const responseData = {
      ...proyecto.toJSON(),
      cliente: cliente.toJSON()
    };

    res.status(200).json(responseData);
    console.log(`[DEBUG] Enviando respuesta exitosa al frontend.`);
    console.log(`--- [DEBUG] Fin obtenerPorId ---\n`);

  } catch (error) {
    console.error('Error al obtener formulario por ID:', error);
    res.status(500).json({ error: 'Error al obtener los datos.' });
  }
};

/**
 * Actualiza un proyecto y su cliente asociado
 * PUT /api/formulario/:id
 */
exports.actualizarFormulario = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const data = req.body;

    const proyecto = await Proyecto.findByPk(id, { transaction: t });
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }

    const cliente = await Cliente.findByPk(proyecto.cliente_id, { transaction: t });
    if (!cliente) {
        await t.rollback();
        return res.status(404).json({ error: 'Cliente asociado no encontrado.' });
    }

    // Si el rango de presupuesto en texto cambia, actualizamos el campo numérico también
    if (data.rango_presupuesto) {
      data.presupuesto = parsePresupuesto(data.rango_presupuesto);
    }

    await proyecto.update(data, { transaction: t });
    await cliente.update(data, { transaction: t });

    await t.commit();
    res.status(200).json({ mensaje: 'Solicitud actualizada correctamente.' });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar la solicitud:', error);
    res.status(500).json({ error: 'Error al actualizar la solicitud.' });
  }
};

/**
 * Elimina un proyecto (y su cliente se queda, pero puedes ajustar esto)
 * DELETE /api/formulario/:id
 */
exports.eliminarFormulario = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const proyecto = await Proyecto.findByPk(id, { transaction: t });
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }

    const clienteId = proyecto.cliente_id;

    // Eliminar el proyecto
    await proyecto.destroy({ transaction: t });

    // Opcional: Si el cliente ya no tiene más proyectos, eliminarlo también.
    const otrosProyectos = await Proyecto.count({ where: { cliente_id: clienteId }, transaction: t });
    if (otrosProyectos === 0) {
      await Cliente.destroy({ where: { id: clienteId }, transaction: t });
    }

    await t.commit();
    res.status(200).json({ mensaje: 'Proyecto eliminado correctamente.' });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto.' });
  }
};