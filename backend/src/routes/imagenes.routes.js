// ============================================
// Rutas de Imágenes
// ============================================

const express = require('express');
const router = express.Router();
const imagenesController = require('../controllers/imagenes.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { uuidParamValidator } = require('../validators/schemas');
const { handleValidationErrors } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ============================================
// RUTAS
// ============================================

/**
 * POST /api/imagenes/mantenimiento/:id
 * Subir imágenes a un mantenimiento (solo Admin)
 */
router.post(
    '/mantenimiento/:id',
    requireAdmin,
    uuidParamValidator,
    handleValidationErrors,
    upload.array('imagenes', 10), // Máximo 10 imágenes por request
    imagenesController.subirImagenes
);

/**
 * DELETE /api/imagenes/:id
 * Eliminar imagen (solo Admin)
 */
router.delete(
    '/:id',
    requireAdmin,
    uuidParamValidator,
    handleValidationErrors,
    imagenesController.eliminar
);

/**
 * PATCH /api/imagenes/:id/orden
 * Actualizar orden de imagen (solo Admin)
 */
router.patch(
    '/:id/orden',
    requireAdmin,
    uuidParamValidator,
    handleValidationErrors,
    imagenesController.actualizarOrden
);

module.exports = router;
