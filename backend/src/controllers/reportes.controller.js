// ============================================
// Controlador de Reportes PDF
// Sistema de Mantenimiento para Condominio
// ============================================

const prisma = require('../config/database');
const { generarReportePDF, subirPDFaCloudinary, CATEGORIAS_LABEL } = require('../services/pdf.service');
const { sendEmail, getReportePDFTemplate } = require('../config/email');

/**
 * Obtener inicio y fin de una semana
 */
function getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);

    const monday = new Date(d.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { inicio: monday, fin: sunday };
}

/**
 * Agrupar imágenes por categoría
 */
function agruparPorCategoria(imagenes) {
    const grupos = {};

    for (const img of imagenes) {
        const categoria = img.categoria || 'OTRA';
        if (!grupos[categoria]) {
            grupos[categoria] = [];
        }
        grupos[categoria].push(img);
    }

    return grupos;
}

/**
 * Generar reportes PDF de la semana (admin)
 */
const generarReportesSemana = async (req, res, next) => {
    try {
        const { semanaInicio, semanaFin } = req.body;

        // Usar fechas proporcionadas o la semana actual
        let inicio, fin;
        if (semanaInicio && semanaFin) {
            inicio = new Date(semanaInicio);
            fin = new Date(semanaFin);
        } else {
            const range = getWeekRange();
            inicio = range.inicio;
            fin = range.fin;
        }

        // Obtener todos los mantenimientos de la semana con imágenes
        const mantenimientos = await prisma.mantenimiento.findMany({
            where: {
                fechaInicio: {
                    gte: inicio,
                    lte: fin
                }
            },
            include: {
                imagenes: true,
                departamento: {
                    select: {
                        id: true,
                        numero: true,
                        torre: true,
                        propietarioNombre: true,
                        propietarioEmail: true
                    }
                }
            }
        });

        if (mantenimientos.length === 0) {
            return res.json({
                success: true,
                message: 'No hay mantenimientos en el rango de fechas especificado',
                data: { reportesGenerados: 0 }
            });
        }

        const reportesGenerados = [];

        // ========== REPORTE GENERAL (ÁREAS COMUNES) ==========
        const mantenimientosComunes = mantenimientos.filter(m => m.area === 'COMUN');

        if (mantenimientosComunes.length > 0) {
            const todasImagenes = mantenimientosComunes.flatMap(m => m.imagenes);
            const imagenesPorCategoria = agruparPorCategoria(todasImagenes);

            const pdfBuffer = await generarReportePDF({
                titulo: 'REPORTE FOTOGRÁFICO SEMANAL',
                condominio: 'ÁREAS COMUNES',
                destinatario: 'Administración',
                cargo: 'Gerente de Mantenimiento',
                descripcion: `Trabajos realizados del ${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}`,
                fecha: fin,
                imagenesPorCategoria
            });

            const filename = `reporte_general_${inicio.toISOString().split('T')[0]}`;
            const cloudinaryResult = await subirPDFaCloudinary(pdfBuffer, filename);

            const reporte = await prisma.reportePDF.create({
                data: {
                    tipo: 'GENERAL',
                    semanaInicio: inicio,
                    semanaFin: fin,
                    urlPdf: cloudinaryResult.secure_url
                }
            });

            reportesGenerados.push(reporte);
        }

        // ========== REPORTES POR DEPARTAMENTO ==========
        const mantenimientosDepto = mantenimientos.filter(m => m.area === 'DEPARTAMENTO' && m.departamentoId);

        // Agrupar por departamento
        const porDepartamento = {};
        for (const m of mantenimientosDepto) {
            if (!porDepartamento[m.departamentoId]) {
                porDepartamento[m.departamentoId] = {
                    departamento: m.departamento,
                    mantenimientos: []
                };
            }
            porDepartamento[m.departamentoId].mantenimientos.push(m);
        }

        // Generar reporte por cada departamento
        for (const deptoId of Object.keys(porDepartamento)) {
            const { departamento, mantenimientos: mantsDepto } = porDepartamento[deptoId];
            const todasImagenes = mantsDepto.flatMap(m => m.imagenes);
            const imagenesPorCategoria = agruparPorCategoria(todasImagenes);

            const pdfBuffer = await generarReportePDF({
                titulo: 'REPORTE FOTOGRÁFICO',
                condominio: `DEPARTAMENTO ${departamento.numero}${departamento.torre ? ` - Torre ${departamento.torre}` : ''}`,
                destinatario: departamento.propietarioNombre,
                cargo: 'Propietario',
                descripcion: `Trabajos realizados del ${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}`,
                fecha: fin,
                imagenesPorCategoria
            });

            const filename = `reporte_depto_${departamento.numero}_${inicio.toISOString().split('T')[0]}`;
            const cloudinaryResult = await subirPDFaCloudinary(pdfBuffer, filename);

            const reporte = await prisma.reportePDF.create({
                data: {
                    tipo: 'DEPARTAMENTO',
                    semanaInicio: inicio,
                    semanaFin: fin,
                    urlPdf: cloudinaryResult.secure_url,
                    departamentoId: deptoId
                }
            });

            reportesGenerados.push(reporte);

            // Enviar por email si el propietario tiene email
            if (departamento.propietarioEmail) {
                try {
                    await sendEmail({
                        to: departamento.propietarioEmail,
                        subject: `Reporte de Mantenimiento - Semana del ${inicio.toLocaleDateString()}`,
                        html: getReportePDFTemplate(
                            departamento.propietarioNombre,
                            inicio.toLocaleDateString(),
                            fin.toLocaleDateString(),
                            cloudinaryResult.secure_url
                        )
                    });
                } catch (emailError) {
                    console.error(`Error enviando email a ${departamento.propietarioEmail}:`, emailError);
                }
            }
        }

        res.json({
            success: true,
            message: `Se generaron ${reportesGenerados.length} reportes`,
            data: {
                reportesGenerados: reportesGenerados.length,
                reportes: reportesGenerados.map(r => ({
                    id: r.id,
                    tipo: r.tipo,
                    urlPdf: r.urlPdf
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Listar reportes (admin/propietario)
 */
const listarReportes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const usuario = req.user;

        const where = {};

        // Si es propietario, solo ver sus reportes
        if (usuario.rol === 'PROPIETARIO') {
            where.OR = [
                { tipo: 'GENERAL' },
                { departamentoId: usuario.departamentoId }
            ];
        }

        const [reportes, total] = await Promise.all([
            prisma.reportePDF.findMany({
                where,
                include: {
                    departamento: {
                        select: { numero: true, torre: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: parseInt(skip),
                take: parseInt(limit)
            }),
            prisma.reportePDF.count({ where })
        ]);

        res.json({
            success: true,
            data: reportes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener un reporte por ID
 */
const obtenerReporte = async (req, res, next) => {
    try {
        const { id } = req.params;
        const usuario = req.user;

        const reporte = await prisma.reportePDF.findUnique({
            where: { id },
            include: {
                departamento: {
                    select: { numero: true, torre: true }
                }
            }
        });

        if (!reporte) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        // Verificar permisos si es propietario
        if (usuario.rol === 'PROPIETARIO') {
            if (reporte.tipo !== 'GENERAL' && reporte.departamentoId !== usuario.departamentoId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver este reporte'
                });
            }
        }

        res.json({
            success: true,
            data: reporte
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar reporte (Admin)
 */
const eliminarReporte = async (req, res, next) => {
    try {
        const { id } = req.params;

        const reporte = await prisma.reportePDF.findUnique({
            where: { id }
        });

        if (!reporte) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        // Eliminar de Cloudinary si tiene URL
        if (reporte.urlPdf) {
            try {
                // Extraer public_id de la URL
                // Formato esperado: .../upload/v12345/carpeta/archivo.pdf
                // O .../upload/carpeta/archivo.pdf
                const partes = reporte.urlPdf.split('/upload/');
                if (partes.length > 1) {
                    let path = partes[1];
                    // Quitar versión si existe (v12345/)
                    if (path.startsWith('v')) {
                        const slashIndex = path.indexOf('/');
                        if (slashIndex !== -1) {
                            path = path.substring(slashIndex + 1);
                        }
                    }
                    // El public_id en raw uploads incluye la extensión, NO se debe quitar
                    // Pero Cloudinary es tricky. Si subí como 'raw' con extension '.pdf' en public_id,
                    // el public_id ES 'mantenimiento/reportes/archivo.pdf'.
                    // Y la URL termina en .pdf

                    // Decodificar URL por si tiene espacios
                    const publicId = decodeURIComponent(path);
                    const { eliminarPDFdeCloudinary } = require('../services/pdf.service');
                    await eliminarPDFdeCloudinary(publicId);
                }
            } catch (cloudError) {
                console.error('Error eliminando archivo de Cloudinary:', cloudError);
                // Continuamos para eliminar de BD aunque falle Cloudinary
            }
        }

        // Eliminar de BD
        await prisma.reportePDF.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Reporte eliminado correctamente'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generarReportesSemana,
    listarReportes,
    obtenerReporte,
    eliminarReporte
};
