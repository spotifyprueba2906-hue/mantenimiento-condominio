// ============================================
// Controlador de Autenticación
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { generateTokens } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario con todos sus departamentos
        const usuario = await prisma.usuario.findUnique({
            where: { email },
            include: {
                departamentos: {
                    include: {
                        departamento: {
                            select: { id: true, numero: true, torre: true, piso: true }
                        }
                    },
                    orderBy: { esPrincipal: 'desc' }
                }
            }
        });

        if (!usuario || !usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Generar tokens
        const { accessToken, refreshToken } = generateTokens(usuario.id);

        // Guardar refresh token en base de datos
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                usuarioId: usuario.id,
                expiresAt
            }
        });

        // Formatear departamentos para la respuesta
        const departamentos = usuario.departamentos.map(ud => ({
            ...ud.departamento,
            esPrincipal: ud.esPrincipal
        }));

        // Departamento activo (el principal o el primero)
        const departamentoActivo = departamentos.find(d => d.esPrincipal) || departamentos[0] || null;

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                accessToken,
                refreshToken,
                usuario: {
                    id: usuario.id,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    rol: usuario.rol,
                    passwordCambiada: usuario.passwordCambiada,
                    departamentos,
                    departamentoActivo
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/refresh
 * Refrescar token de acceso
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token requerido'
            });
        }

        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token inválido o expirado'
            });
        }

        // Buscar token en base de datos
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token },
            include: { usuario: true }
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            if (storedToken) {
                await prisma.refreshToken.delete({ where: { id: storedToken.id } });
            }
            return res.status(401).json({
                success: false,
                message: 'Refresh token expirado'
            });
        }

        // Generar nuevos tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        // Actualizar refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                token: newRefreshToken,
                expiresAt
            }
        });

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken }
            });
        }

        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me
 * Obtener usuario actual
 */
const getMe = async (req, res, next) => {
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                nombre: true,
                rol: true,
                passwordCambiada: true,
                departamentos: {
                    include: {
                        departamento: {
                            select: { id: true, numero: true, torre: true, piso: true }
                        }
                    },
                    orderBy: { esPrincipal: 'desc' }
                }
            }
        });

        // Formatear departamentos
        const departamentos = usuario.departamentos.map(ud => ({
            ...ud.departamento,
            esPrincipal: ud.esPrincipal
        }));

        const departamentoActivo = departamentos.find(d => d.esPrincipal) || departamentos[0] || null;

        res.json({
            success: true,
            data: {
                ...usuario,
                departamentos,
                departamentoActivo
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/cambiar-password
 * Cambiar contraseña
 */
const cambiarPassword = async (req, res, next) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        // Obtener usuario con hash de contraseña
        const usuario = await prisma.usuario.findUnique({
            where: { id: req.user.id }
        });

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(passwordActual, usuario.passwordHash);

        if (!passwordValida) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Hash de nueva contraseña
        const nuevoHash = await bcrypt.hash(passwordNueva, 12);

        // Actualizar contraseña
        await prisma.usuario.update({
            where: { id: req.user.id },
            data: {
                passwordHash: nuevoHash,
                passwordCambiada: true
            }
        });

        // Invalidar todos los refresh tokens del usuario
        await prisma.refreshToken.deleteMany({
            where: { usuarioId: req.user.id }
        });

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente. Por favor, inicie sesión nuevamente.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/registro-admin
 * Registrar nuevo administrador
 */
const registrarAdmin = async (req, res, next) => {
    try {
        // Verificar que quien registra es admin
        if (req.user.rol !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden registrar nuevos admins'
            });
        }

        const { email, password, nombre } = req.body;

        // Hash de contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        const nuevoAdmin = await prisma.usuario.create({
            data: {
                email,
                passwordHash,
                nombre,
                rol: 'ADMIN',
                passwordCambiada: true // Admins no necesitan cambiar contraseña
            },
            select: {
                id: true,
                email: true,
                nombre: true,
                rol: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Administrador registrado correctamente',
            data: nuevoAdmin
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/cambiar-departamento
 * Cambiar departamento activo del usuario
 */
const cambiarDepartamento = async (req, res, next) => {
    try {
        const { departamentoId } = req.body;

        // Verificar que el usuario tiene acceso a este departamento
        const usuarioDepartamento = await prisma.usuarioDepartamento.findFirst({
            where: {
                usuarioId: req.user.id,
                departamentoId
            },
            include: {
                departamento: {
                    select: { id: true, numero: true, torre: true, piso: true }
                }
            }
        });

        if (!usuarioDepartamento) {
            return res.status(403).json({
                success: false,
                message: 'No tiene acceso a este departamento'
            });
        }

        // Quitar esPrincipal de todos los departamentos del usuario
        await prisma.usuarioDepartamento.updateMany({
            where: { usuarioId: req.user.id },
            data: { esPrincipal: false }
        });

        // Establecer nuevo departamento principal
        await prisma.usuarioDepartamento.update({
            where: { id: usuarioDepartamento.id },
            data: { esPrincipal: true }
        });

        res.json({
            success: true,
            message: 'Departamento cambiado correctamente',
            data: {
                departamentoActivo: {
                    ...usuarioDepartamento.departamento,
                    esPrincipal: true
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    refreshToken,
    logout,
    getMe,
    cambiarPassword,
    registrarAdmin,
    cambiarDepartamento
};
