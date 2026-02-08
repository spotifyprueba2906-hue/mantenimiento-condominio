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

        // Buscar usuario en base de datos
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                nombre: true,
                rol: true,
                departamentoId: true,
                passwordCambiada: true,
                activo: true
            }
        });

        if (!usuario || !usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido o inactivo'
            });
        }

        req.user = usuario;
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
    generateTokens
};
