// ============================================
// Controlador de Mantenimientos
// ============================================

const prisma = require('../config/database');

/**
 * GET /api/mantenimientos
 * Listar mantenimientos
 */
const listar = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, tipo, area, estado } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construir filtro
        const where = {};

        if (tipo) where.tipo = tipo;
        if (area) where.area = area;
        if (estado) where.estado = estado;

        // Si es propietario, solo ve mantenimientos de su departamento y áreas comunes
        if (req.user.rol === 'PROPIETARIO') {
            where.OR = [
                { area: 'COMUN' },
                { departamentoId: req.user.departamentoId }
            ];
        }

        const [mantenimientos, total] = await Promise.all([
            prisma.mantenimiento.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { fechaInicio: 'desc' },
                include: {
                    departamento: {
                        select: { id: true, numero: true, torre: true }
                    },
                    imagenes: {
                        select: { id: true, urlCloudinary: true, descripcion: true },
                        orderBy: { orden: 'asc' }
                    },
                    _count: {
                        select: { imagenes: true }
                    }
                }
            }),
            prisma.mantenimiento.count({ where })
        ]);

        res.json({
            success: true,
            data: mantenimientos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/mantenimientos/:id
 * Obtener mantenimiento por ID
 */
const obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const mantenimiento = await prisma.mantenimiento.findUnique({
            where: { id },
            include: {
                departamento: {
                    select: { id: true, numero: true, torre: true, propietarioNombre: true }
                },
                imagenes: {
                    orderBy: { orden: 'asc' }
                }
            }
        });

        if (!mantenimiento) {
            return res.status(404).json({
                success: false,
                message: 'Mantenimiento no encontrado'
            });
        }

        // Verificar acceso para propietarios
        if (req.user.rol === 'PROPIETARIO') {
            if (mantenimiento.area !== 'COMUN' && mantenimiento.departamentoId !== req.user.departamentoId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene acceso a este mantenimiento'
                });
            }
        }

        res.json({
            success: true,
            data: mantenimiento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/mantenimientos
 * Crear mantenimiento
 */
const crear = async (req, res, next) => {
    try {
        const {
            titulo,
            descripcion,
            tipo,
            area,
            departamentoId,
            fechaInicio,
            fechaFin,
            responsable,
            costo,
            notas
        } = req.body;

        // Validar que si es de departamento, tenga departamentoId
        if (area === 'DEPARTAMENTO' && !departamentoId) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar el departamento para mantenimientos de departamento'
            });
        }

        const mantenimiento = await prisma.mantenimiento.create({
            data: {
                titulo,
                descripcion,
                tipo,
                area,
                departamentoId: area === 'DEPARTAMENTO' ? departamentoId : null,
                fechaInicio: new Date(fechaInicio),
                fechaFin: fechaFin ? new Date(fechaFin) : null,
                responsable,
                costo: costo ? parseFloat(costo) : null,
                notas
            },
            include: {
                departamento: {
                    select: { id: true, numero: true, torre: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Mantenimiento creado correctamente',
            data: mantenimiento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/mantenimientos/:id
 * Actualizar mantenimiento
 */
const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            titulo,
            descripcion,
            tipo,
            area,
            departamentoId,
            fechaInicio,
            fechaFin,
            responsable,
            costo,
            notas
        } = req.body;

        const mantenimiento = await prisma.mantenimiento.update({
            where: { id },
            data: {
                titulo,
                descripcion,
                tipo,
                area,
                departamentoId: area === 'DEPARTAMENTO' ? departamentoId : null,
                fechaInicio: new Date(fechaInicio),
                fechaFin: fechaFin ? new Date(fechaFin) : null,
                responsable,
                costo: costo ? parseFloat(costo) : null,
                notas
            },
            include: {
                departamento: {
                    select: { id: true, numero: true, torre: true }
                },
                imagenes: true
            }
        });

        res.json({
            success: true,
            message: 'Mantenimiento actualizado correctamente',
            data: mantenimiento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/mantenimientos/:id/estado
 * Cambiar estado de mantenimiento
 */
const cambiarEstado = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const mantenimiento = await prisma.mantenimiento.update({
            where: { id },
            data: {
                estado,
                fechaFin: estado === 'COMPLETADO' ? new Date() : undefined
            }
        });

        res.json({
            success: true,
            message: 'Estado actualizado correctamente',
            data: mantenimiento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/mantenimientos/:id
 * Eliminar mantenimiento
 */
const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Primero eliminar imágenes asociadas
        await prisma.imagen.deleteMany({
            where: { mantenimientoId: id }
        });

        await prisma.mantenimiento.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Mantenimiento eliminado correctamente'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listar,
    obtenerPorId,
    crear,
    actualizar,
    cambiarEstado,
    eliminar
};
