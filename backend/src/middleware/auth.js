// ============================================
// Middleware de Autenticación JWT
// ============================================

const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Verificar token JWT y agregar usuario a request
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar usuario con sus departamentos
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                nombre: true,
                rol: true,
                passwordCambiada: true,
                activo: true,
                departamentos: {
                    include: {
                        departamento: {
                            select: { id: true, numero: true, torre: true }
                        }
                    },
                    orderBy: { esPrincipal: 'desc' }
                }
            }
        });

        if (!usuario || !usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido o inactivo'
            });
        }

        // Formatear departamentos y encontrar el activo
        const departamentos = usuario.departamentos.map(ud => ({
            id: ud.departamento.id,
            numero: ud.departamento.numero,
            torre: ud.departamento.torre,
            esPrincipal: ud.esPrincipal
        }));

        const departamentoActivo = departamentos.find(d => d.esPrincipal) || departamentos[0] || null;

        // Agregar información formateada al request
        req.user = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol,
            passwordCambiada: usuario.passwordCambiada,
            activo: usuario.activo,
            departamentos,
            departamentoActivo,
            // Para compatibilidad con código existente
            departamentoId: departamentoActivo?.id || null
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

/**
 * Verificar que el usuario sea administrador
 */
const requireAdmin = (req, res, next) => {
    if (req.user.rol !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador'
        });
    }
    next();
};

/**
 * Verificar que el propietario haya cambiado su contraseña
 */
const requirePasswordChanged = (req, res, next) => {
    if (req.user.rol === 'PROPIETARIO' && !req.user.passwordCambiada) {
        return res.status(403).json({
            success: false,
            message: 'Debe cambiar su contraseña antes de continuar',
            code: 'PASSWORD_CHANGE_REQUIRED'
        });
    }
    next();
};

/**
 * Verificar que el usuario tenga acceso a un departamento específico
 */
const requireDepartamentoAccess = (paramName = 'departamentoId') => {
    return (req, res, next) => {
        const departamentoId = req.params[paramName] || req.body.departamentoId;

        // Admins tienen acceso a todo
        if (req.user.rol === 'ADMIN') {
            return next();
        }

        // Verificar que el propietario tenga acceso al departamento
        const tieneAcceso = req.user.departamentos.some(d => d.id === departamentoId);

        if (!tieneAcceso) {
            return res.status(403).json({
                success: false,
                message: 'No tiene acceso a este departamento'
            });
        }

        next();
    };
};

/**
 * Generar tokens JWT
 */
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requirePasswordChanged,
    requireDepartamentoAccess,
    generateTokens
};
