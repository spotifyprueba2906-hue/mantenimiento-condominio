// ============================================
// Rutas de Mantenimientos
// ============================================

const express = require('express');
const router = express.Router();
const mantenimientosController = require('../controllers/mantenimientos.controller');
const { authenticateToken, requireAdmin, requirePasswordChanged } = require('../middleware/auth');
const { mantenimientoValidator, uuidParamValidator, paginacionValidator } = require('../validators/schemas');
const { handleValidationErrors } = require('../middleware/validation');

// Todas las rutas requieren autenticación y contraseña cambiada
router.use(authenticateToken);
router.use(requirePasswordChanged);

// ============================================
// RUTAS
// ============================================

/**
 * GET /api/mantenimientos
 * Listar mantenimientos
 */
router.get('/', paginacionValidator, handleValidationErrors, mantenimientosController.listar);

/**
 * GET /api/mantenimientos/:id
 * Obtener mantenimiento por ID
 */
router.get('/:id', uuidParamValidator, handleValidationErrors, mantenimientosController.obtenerPorId);

/**
 * POST /api/mantenimientos
 * Crear mantenimiento (solo Admin)
 */
router.post(
    '/',
    requireAdmin,
    mantenimientoValidator,
    handleValidationErrors,
    mantenimientosController.crear
);

/**
 * PUT /api/mantenimientos/:id
 * Actualizar mantenimiento (solo Admin)
 */
router.put(
    '/:id',
    requireAdmin,
    uuidParamValidator,
    mantenimientoValidator,
    handleValidationErrors,
    mantenimientosController.actualizar
);

/**
 * PATCH /api/mantenimientos/:id/estado
 * Cambiar estado de mantenimiento (solo Admin)
 */
router.patch(
    '/:id/estado',
    requireAdmin,
    uuidParamValidator,
    handleValidationErrors,
    mantenimientosController.cambiarEstado
);

/**
 * DELETE /api/mantenimientos/:id
 * Eliminar mantenimiento (solo Admin)
 */
router.delete(
    '/:id',
    requireAdmin,
    uuidParamValidator,
    handleValidationErrors,
    mantenimientosController.eliminar
);

module.exports = router;
