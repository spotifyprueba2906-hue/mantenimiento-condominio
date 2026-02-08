// ============================================
// Middleware de Validación
// ============================================

const { validationResult } = require('express-validator');

/**
 * Procesar errores de validación de express-validator
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: errors.array().map(err => ({
                campo: err.path,
                mensaje: err.msg
            }))
        });
    }

    next();
};

module.exports = { handleValidationErrors };
