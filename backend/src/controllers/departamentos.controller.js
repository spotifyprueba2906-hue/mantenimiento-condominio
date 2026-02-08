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
 * Crear usuario propietario para departamento o asignar usuario existente
 */
const crearUsuarioPropietario = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Obtener departamento
        const departamento = await prisma.departamento.findUnique({
            where: { id },
            include: {
                usuarios: {
                    include: { usuario: true }
                }
            }
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

        // Verificar si ya existe un usuario asociado a este departamento
        if (departamento.usuarios.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un usuario para este departamento'
            });
        }

        // Buscar si el email ya está registrado como usuario
        let usuario = await prisma.usuario.findUnique({
            where: { email: departamento.propietarioEmail }
        });

        let yaExistia = false;
        let passwordGenerica = process.env.DEFAULT_OWNER_PASSWORD || 'Ingcor2024';

        if (usuario) {
            // Usuario ya existe, solo asignarlo al departamento
            yaExistia = true;
        } else {
            // Crear nuevo usuario
            const passwordHash = await bcrypt.hash(passwordGenerica, 12);

            usuario = await prisma.usuario.create({
                data: {
                    email: departamento.propietarioEmail,
                    passwordHash,
                    nombre: departamento.propietarioNombre,
                    rol: 'PROPIETARIO',
                    passwordCambiada: false
                }
            });
        }

        // Crear relación usuario-departamento
        const esPrimero = await prisma.usuarioDepartamento.count({
            where: { usuarioId: usuario.id }
        }) === 0;

        await prisma.usuarioDepartamento.create({
            data: {
                usuarioId: usuario.id,
                departamentoId: id,
                esPrincipal: esPrimero // Es principal si es su primer departamento
            }
        });

        // Enviar email de bienvenida solo si es usuario nuevo
        if (!yaExistia) {
            try {
                await emailService.enviarBienvenida(
                    departamento.propietarioEmail,
                    departamento.propietarioNombre,
                    `${departamento.numero}${departamento.torre ? ' - Torre ' + departamento.torre : ''}`,
                    passwordGenerica
                );
            } catch (emailError) {
                console.error('Error enviando email de bienvenida:', emailError);
            }
        }

        const mensaje = yaExistia
            ? 'Departamento asignado al usuario existente.'
            : 'Usuario propietario creado correctamente. Se envió email con credenciales.';

        res.status(201).json({
            success: true,
            message: mensaje,
            data: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                yaExistia
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/departamentos/:id/asignar-usuario
 * Asignar un usuario existente a un departamento (admin)
 */
const asignarUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { usuarioId } = req.body;

        // Verificar departamento
        const departamento = await prisma.departamento.findUnique({
            where: { id }
        });

        if (!departamento) {
            return res.status(404).json({
                success: false,
                message: 'Departamento no encontrado'
            });
        }

        // Verificar usuario
        const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar si ya está asignado
        const yaAsignado = await prisma.usuarioDepartamento.findFirst({
            where: { usuarioId, departamentoId: id }
        });

        if (yaAsignado) {
            return res.status(409).json({
                success: false,
                message: 'El usuario ya está asignado a este departamento'
            });
        }

        // Crear asignación
        await prisma.usuarioDepartamento.create({
            data: {
                usuarioId,
                departamentoId: id,
                esPrincipal: false
            }
        });

        res.status(201).json({
            success: true,
            message: 'Usuario asignado al departamento correctamente',
            data: {
                usuarioId: usuario.id,
                usuarioEmail: usuario.email,
                departamentoId: id,
                departamentoNumero: departamento.numero
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/departamentos/:id/usuarios/:usuarioId
 * Desasignar usuario de un departamento
 */
const desasignarUsuario = async (req, res, next) => {
    try {
        const { id, usuarioId } = req.params;

        const relacion = await prisma.usuarioDepartamento.findFirst({
            where: { usuarioId, departamentoId: id }
        });

        if (!relacion) {
            return res.status(404).json({
                success: false,
                message: 'El usuario no está asignado a este departamento'
            });
        }

        await prisma.usuarioDepartamento.delete({
            where: { id: relacion.id }
        });

        // Si era principal, asignar otro como principal
        if (relacion.esPrincipal) {
            const otroDepto = await prisma.usuarioDepartamento.findFirst({
                where: { usuarioId }
            });
            if (otroDepto) {
                await prisma.usuarioDepartamento.update({
                    where: { id: otroDepto.id },
                    data: { esPrincipal: true }
                });
            }
        }

        res.json({
            success: true,
            message: 'Usuario desasignado del departamento'
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
    crearUsuarioPropietario,
    asignarUsuario,
    desasignarUsuario
};
