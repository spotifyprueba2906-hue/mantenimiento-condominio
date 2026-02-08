// ============================================
// Rutas Públicas - Áreas Comunes
// ============================================

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { paginacionValidator } = require('../validators/schemas');
const { handleValidationErrors } = require('../middleware/validation');

// ============================================
// RUTAS PÚBLICAS (Sin autenticación)
// ============================================

/**
 * GET /api/public/mantenimientos
 * Listar mantenimientos de áreas comunes (público)
 */
router.get('/mantenimientos', paginacionValidator, handleValidationErrors, async (req, res, next) => {
    try {
        const { page = 1, limit = 20, tipo } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            area: 'COMUN',
            estado: { in: ['COMPLETADO', 'EN_PROGRESO'] }
        };
        if (tipo) where.tipo = tipo;

        const [mantenimientos, total] = await Promise.all([
            prisma.mantenimiento.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { fechaInicio: 'desc' },
                select: {
                    id: true,
                    titulo: true,
                    descripcion: true,
                    tipo: true,
                    fechaInicio: true,
                    fechaFin: true,
                    estado: true,
                    responsable: true,
                    imagenes: {
                        select: {
                            id: true,
                            urlCloudinary: true,
                            descripcion: true
                        },
                        orderBy: { orden: 'asc' }
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
});

/**
 * GET /api/public/mantenimientos/:id
 * Obtener detalle de mantenimiento público
 */
router.get('/mantenimientos/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const mantenimiento = await prisma.mantenimiento.findFirst({
            where: {
                id,
                area: 'COMUN'
            },
            include: {
                imagenes: {
                    orderBy: { orden: 'asc' }
                }
            }
        });

        if (!mantenimiento) {
            return res.status(404).json({
                success: false,
                message: 'Mantenimiento no encontrado o no es de área común'
            });
        }

        res.json({
            success: true,
            data: mantenimiento
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/public/resumen
 * Resumen de mantenimientos para página principal
 */
router.get('/resumen', async (req, res, next) => {
    try {
        const [totales, recientes] = await Promise.all([
            // Contar por estado
            prisma.mantenimiento.groupBy({
                by: ['estado'],
                where: { area: 'COMUN' },
                _count: { id: true }
            }),
            // Últimos 5 mantenimientos
            prisma.mantenimiento.findMany({
                where: { area: 'COMUN' },
                orderBy: { fechaInicio: 'desc' },
                take: 5,
                select: {
                    id: true,
                    titulo: true,
                    tipo: true,
                    estado: true,
                    fechaInicio: true,
                    imagenes: {
                        take: 1,
                        select: { urlCloudinary: true }
                    }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                estadisticas: totales.reduce((acc, item) => {
                    acc[item.estado.toLowerCase()] = item._count.id;
                    return acc;
                }, {}),
                recientes
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
