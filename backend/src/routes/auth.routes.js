// ============================================
// Rutas de Autenticación
// ============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');
const {
    loginValidator,
    cambiarPasswordValidator,
    registroAdminValidator
} = require('../validators/schemas');
const { handleValidationErrors } = require('../middleware/validation');

// ============================================
// RUTAS PÚBLICAS
// ============================================

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', loginValidator, handleValidationErrors, authController.login);

/**
 * POST /api/auth/refresh
 * Refrescar token de acceso
 */
router.post('/refresh', authController.refreshToken);

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', authController.logout);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

/**
 * GET /api/auth/me
 * Obtener usuario actual
 */
router.get('/me', authenticateToken, authController.getMe);

/**
 * POST /api/auth/cambiar-password
 * Cambiar contraseña (requerido para propietarios nuevos)
 */
router.post(
    '/cambiar-password',
    authenticateToken,
    cambiarPasswordValidator,
    handleValidationErrors,
    authController.cambiarPassword
);

// ============================================
// RUTAS DE ADMIN
// ============================================

/**
 * POST /api/auth/registro-admin
 * Registrar nuevo administrador (solo admins)
 */
router.post(
    '/registro-admin',
    authenticateToken,
    registroAdminValidator,
    handleValidationErrors,
    authController.registrarAdmin
);

module.exports = router;
