// ============================================
// Rutas de Sugerencias
// Sistema de Mantenimiento para Condominio
// ============================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const sugerenciasController = require('../controllers/sugerencias.controller');

// ============================================
// Validadores
// ============================================

const sugerenciaValidator = [
    body('mensaje')
        .trim()
        .notEmpty()
        .withMessage('El mensaje es requerido')
        .isLength({ min: 10, max: 1000 })
        .withMessage('El mensaje debe tener entre 10 y 1000 caracteres'),
    handleValidationErrors
];

// ============================================
// Rutas
// ============================================

// Crear sugerencia (propietario autenticado)
router.post('/',
    authenticateToken,
    sugerenciaValidator,
    sugerenciasController.crearSugerencia
);

// Listar sugerencias (solo admin)
router.get('/',
    authenticateToken,
    requireAdmin,
    sugerenciasController.listarSugerencias
);

// Eliminar sugerencia (solo admin)
router.delete('/:id',
    authenticateToken,
    requireAdmin,
    sugerenciasController.eliminarSugerencia
);

module.exports = router;
