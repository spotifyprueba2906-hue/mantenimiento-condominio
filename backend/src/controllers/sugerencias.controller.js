// ============================================
// Controlador de Sugerencias
// Sistema de Mantenimiento para Condominio
// ============================================

const prisma = require('../config/database');

/**
 * Crear una nueva sugerencia (propietario)
 */
const crearSugerencia = async (req, res, next) => {
    try {
        const { mensaje } = req.body;
        const usuario = req.user;

        // Verificar que el usuario tiene departamento asignado
        if (!usuario.departamentoId) {
            return res.status(400).json({
                success: false,
                message: 'No tienes un departamento asignado'
            });
        }

        const sugerencia = await prisma.sugerencia.create({
            data: {
                mensaje: mensaje.trim(),
                departamentoId: usuario.departamentoId
            },
            include: {
                departamento: {
                    select: { numero: true, torre: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Sugerencia enviada correctamente',
            data: sugerencia
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Listar todas las sugerencias (admin)
 */
const listarSugerencias = async (req, res, next) => {
    try {
        const { departamentoId, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const where = {};
        if (departamentoId) {
            where.departamentoId = departamentoId;
        }

        const [sugerencias, total] = await Promise.all([
            prisma.sugerencia.findMany({
                where,
                include: {
                    departamento: {
                        select: {
                            numero: true,
                            torre: true,
                            propietarioNombre: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: parseInt(skip),
                take: parseInt(limit)
            }),
            prisma.sugerencia.count({ where })
        ]);

        res.json({
            success: true,
            data: sugerencias,
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
 * Eliminar sugerencia (admin)
 */
const eliminarSugerencia = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.sugerencia.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Sugerencia eliminada'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    crearSugerencia,
    listarSugerencias,
    eliminarSugerencia
};
