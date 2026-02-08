// ============================================
// Controlador de Departamentos
// ============================================

const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const emailService = require('../services/email.service');

/**
 * GET /api/departamentos
 * Listar departamentos
 */
const listar = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Si es propietario, solo ve su departamento
        const where = req.user.rol === 'PROPIETARIO'
            ? { id: req.user.departamentoId, activo: true }
            : { activo: true };

        const [departamentos, total] = await Promise.all([
            prisma.departamento.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: [
                    { torre: 'asc' },
                    { numero: 'asc' }
                ],
                include: {
                    _count: {
                        select: { mantenimientos: true }
                    }
                }
            }),
            prisma.departamento.count({ where })
        ]);

        res.json({
            success: true,
            data: departamentos,
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
 * GET /api/departamentos/:id
 * Obtener departamento por ID
 */
const obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verificar acceso
        if (req.user.rol === 'PROPIETARIO' && req.user.departamentoId !== id) {
            return res.status(403).json({
                success: false,
                message: 'No tiene acceso a este departamento'
            });
        }

        const departamento = await prisma.departamento.findUnique({
            where: { id },
            include: {
                mantenimientos: {
                    where: { area: 'DEPARTAMENTO' },
                    orderBy: { fechaInicio: 'desc' },
                    take: 10,
                    include: {
                        imagenes: true
                    }
                },
                usuarios: {
                    select: {
                        id: true,
                        email: true,
                        nombre: true,
                        passwordCambiada: true
                    }
                }
            }
        });

        if (!departamento) {
            return res.status(404).json({
                success: false,
                message: 'Departamento no encontrado'
            });
        }

        res.json({
            success: true,
            data: departamento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/departamentos
 * Crear departamento
 */
const crear = async (req, res, next) => {
    try {
        const { numero, torre, piso, propietarioNombre, propietarioEmail, propietarioTelefono } = req.body;

        const departamento = await prisma.departamento.create({
            data: {
                numero,
                torre,
                piso,
                propietarioNombre,
                propietarioEmail,
                propietarioTelefono
            }
        });

        res.status(201).json({
            success: true,
            message: 'Departamento creado correctamente',
            data: departamento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/departamentos/:id
 * Actualizar departamento
 */
const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { numero, torre, piso, propietarioNombre, propietarioEmail, propietarioTelefono } = req.body;

        const departamento = await prisma.departamento.update({
            where: { id },
            data: {
                numero,
                torre,
                piso,
                propietarioNombre,
                propietarioEmail,
                propietarioTelefono
            }
        });

        res.json({
            success: true,
            message: 'Departamento actualizado correctamente',
            data: departamento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/departamentos/:id
 * Eliminar departamento (soft delete)
 */
const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.departamento.update({
            where: { id },
            data: { activo: false }
        });

        // También desactivar usuarios asociados
        await prisma.usuario.updateMany({
            where: { departamentoId: id },
            data: { activo: false }
        });

        res.json({
            success: true,
            message: 'Departamento eliminado correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/departamentos/:id/crear-usuario
 * Crear usuario propietario para departamento
 */
const crearUsuarioPropietario = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Obtener departamento
        const departamento = await prisma.departamento.findUnique({
            where: { id }
        });

        if (!departamento) {
            return res.status(404).json({
                success: false,
                message: 'Departamento no encontrado'
            });
        }

        if (!departamento.propietarioEmail) {
            return res.status(400).json({
                success: false,
                message: 'El departamento no tiene email de propietario configurado'
            });
        }

        // Verificar si ya existe usuario
        const usuarioExistente = await prisma.usuario.findFirst({
            where: { departamentoId: id }
        });

        if (usuarioExistente) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un usuario para este departamento'
            });
        }

        // Generar contraseña genérica
        const passwordGenerica = process.env.DEFAULT_OWNER_PASSWORD || 'Ingcor2024';
        const passwordHash = await bcrypt.hash(passwordGenerica, 12);

        // Crear usuario
        const usuario = await prisma.usuario.create({
            data: {
                email: departamento.propietarioEmail,
                passwordHash,
                nombre: departamento.propietarioNombre,
                rol: 'PROPIETARIO',
                departamentoId: id,
                passwordCambiada: false
            },
            select: {
                id: true,
                email: true,
                nombre: true
            }
        });

        // Enviar email de bienvenida
        try {
            await emailService.enviarBienvenida(
                departamento.propietarioEmail,
                departamento.propietarioNombre,
                `${departamento.numero}${departamento.torre ? ' - Torre ' + departamento.torre : ''}`,
                passwordGenerica
            );
        } catch (emailError) {
            console.error('Error enviando email de bienvenida:', emailError);
            // No fallar si el email no se envía
        }

        res.status(201).json({
            success: true,
            message: 'Usuario propietario creado correctamente. Se envió email con credenciales.',
            data: usuario
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
    eliminar,
    crearUsuarioPropietario
};
