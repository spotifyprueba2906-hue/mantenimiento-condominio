// ============================================
// Rutas de Reportes PDF
// Sistema de Mantenimiento para Condominio
// ============================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const reportesController = require('../controllers/reportes.controller');

// ============================================
// Validadores
// ============================================

const generarReporteValidator = [
    body('semanaInicio')
        .optional()
        .isISO8601()
        .withMessage('Fecha de inicio inválida'),
    body('semanaFin')
        .optional()
        .isISO8601()
        .withMessage('Fecha de fin inválida'),
    handleValidationErrors
];

// ============================================
// Rutas
// ============================================

// Generar reportes de la semana (admin)
router.post('/generar',
    authenticateToken,
    requireAdmin,
    generarReporteValidator,
    reportesController.generarReportesSemana
);

// Listar reportes (admin ve todos, propietario ve los suyos)
router.get('/',
    authenticateToken,
    reportesController.listarReportes
);

// Obtener un reporte específico
router.get('/:id',
    authenticateToken,
    reportesController.obtenerReporte
);

module.exports = router;
