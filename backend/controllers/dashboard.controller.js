const db = require("../models");
const { sequelize } = require("../models");
const Proyecto = db.proyectos;

exports.getMetrics = async (req, res) => {
  try {
    // 1. Total de Solicitudes
    const totalSolicitudes = await Proyecto.count();

    // 2. Presupuesto Promedio
    const promedioPresupuestoResult = await Proyecto.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('presupuesto')), 'promedio']],
      raw: true,
    });
    const promedioPresupuesto = promedioPresupuestoResult && promedioPresupuestoResult.promedio ? parseFloat(promedioPresupuestoResult.promedio) : 0;

    // 3. Tipos de Negocio (conteo de valores únicos)
    const tiposNegocioResult = await Proyecto.findAll({
      attributes: [[sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('tipo_negocio'))), 'conteo']],
      raw: true,
    });
    const tiposNegocio = (tiposNegocioResult && tiposNegocioResult.length > 0 && tiposNegocioResult[0].conteo) 
      ? parseInt(tiposNegocioResult[0].conteo, 10) 
      : 0;

    // 4. Próximo Proyecto (basado en la fecha límite más cercana en el futuro)
    const proximoProyecto = await Proyecto.findOne({
      where: {
        fecha_limite: {
          [db.Sequelize.Op.gte]: new Date() // Fecha límite mayor o igual a hoy
        }
      },
      order: [['fecha_limite', 'ASC']],
      attributes: ['producto_principal', 'fecha_limite']
    });

    // Ensamblar la respuesta
    const metrics = {
      totalSolicitudes,
      promedioPresupuesto,
      tiposNegocio,
      proximoProyecto: proximoProyecto ? {
        nombre: proximoProyecto.producto_principal,
        fecha: proximoProyecto.fecha_limite
      } : null,
    };

    res.status(200).send(metrics);

  } catch (error) {
    console.error("Error al obtener las métricas del dashboard:", error);
    res.status(500).send({ message: "Ocurrió un error al calcular las métricas." });
  }
};

exports.getChartData = async (req, res) => {
  try {
    // 1. Distribución por Tipo de Negocio (Gráfico de Dona)
    const distribucionNegocios = await Proyecto.findAll({
      group: ['tipo_negocio'],
      attributes: ['tipo_negocio', [sequelize.fn('COUNT', 'tipo_negocio'), 'count']],
      raw: true,
    });

    // 2. Evolución de Solicitudes en los últimos 7 días (Gráfico de Línea)
    // Usamos una consulta SQL directa porque es más eficiente para generar series de fechas.
    const [evolucionSolicitudes] = await db.sequelize.query(`
      SELECT
        to_char(date_series.day, 'YYYY-MM-DD') AS date,
        COUNT(proyectos.id) AS count
      FROM (
        SELECT generate_series(
          current_date - interval '6 days',
          current_date,
          '1 day'
        )::date AS day
      ) AS date_series
      LEFT JOIN proyectos ON to_char(proyectos.fecha_creacion, 'YYYY-MM-DD') = to_char(date_series.day, 'YYYY-MM-DD')
      GROUP BY date_series.day
      ORDER BY date_series.day ASC;
    `);

    res.status(200).json({ distribucionNegocios, evolucionSolicitudes });

  } catch (error) {
    console.error("Error al obtener los datos para los gráficos:", error);
    res.status(500).send({ message: "Ocurrió un error al obtener los datos para los gráficos." });
  }
};