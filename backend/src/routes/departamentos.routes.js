// ============================================
// Rutas de Departamentos
// ============================================

const express = require('express');
const router = express.Router();
const departamentosController = require('../controllers/departamentos.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { departamentoValidator, uuidParamValidator, paginacionValidator } = require('../validators/schemas');
const { handleValidationErrors } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ============================================
// RUTAS
// ============================================

/**
 * GET /api/departamentos
 * Listar departamentos (Admin: todos, Propietario: solo el suyo)
 */
router.get('/', paginacionValidator, handleValidationErrors, departamentosController.listar);

/**
 * GET /api/departamentos/:id
 * Obtener departamento por ID
 */
router.get('/:id', uuidParamValidator, handleValidationErrors, departamentosController.obtenerPorId);

/**
 * POST /api/departamentos
 * Crear departamento (solo Admin)
 */
router.post(
    '/',
    requireAdmin,
    departamentoValidator,
    handleValidationErrors,
    departamentosController.crear
);

/**
 * PUT /api/departamentos/:id
 * Actualizar departamento (solo Admin)
 */
router.put(
    '/:id',
    requireAdmin,
    uuidParamValidator,
    departamentoValidator,
    handleValidationErrors,
    departamentosController.actualizar
);

/**
 * DELETE /api/departamentos/:id
 * Eliminar departamento (solo Admin)
 */
router.delete(
    '/:id',
    requireAdmin,
    uuidParamValidator,
    handleValidationErrors,
    departamentosController.eliminar
);

/**
 * POST /api/departamentos/:id/crear-usuario
 * Crear usuario propietario para departamento (solo Admin)
 */
router.post(
    '/:id/crear-usuario',
    requireAdmin,
    uuidParamValidator,
    handleValidationErrors,
    departamentosController.crearUsuarioPropietario
);

module.exports = router;
