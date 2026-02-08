// ============================================
// Esquemas de Validación - Express Validator
// Prevención de SQL Injection y XSS
// ============================================

const { body, param, query } = require('express-validator');

/**
 * Sanitizar texto para prevenir XSS
 */
const sanitizeText = (value) => {
    if (typeof value !== 'string') return value;
    return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};

// ============================================
// VALIDADORES DE AUTENTICACIÓN
// ============================================

const loginValidator = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email demasiado largo'),
    body('password')
        .isLength({ min: 6, max: 100 })
        .withMessage('La contraseña debe tener entre 6 y 100 caracteres')
];

const cambiarPasswordValidator = [
    body('passwordActual')
        .isLength({ min: 6, max: 100 })
        .withMessage('Contraseña actual requerida'),
    body('passwordNueva')
        .isLength({ min: 8, max: 100 })
        .withMessage('La nueva contraseña debe tener mínimo 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe incluir mayúscula, minúscula y número')
];

const registroAdminValidator = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8, max: 100 })
        .withMessage('La contraseña debe tener mínimo 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe incluir mayúscula, minúscula y número'),
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .customSanitizer(sanitizeText)
];

// ============================================
// VALIDADORES DE DEPARTAMENTOS
// ============================================

const departamentoValidator = [
    body('numero')
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Número de departamento requerido (máx 20 caracteres)')
        .customSanitizer(sanitizeText),
    body('torre')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Torre máximo 50 caracteres')
        .customSanitizer(sanitizeText),
    body('piso')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .customSanitizer(sanitizeText),
    body('propietarioNombre')
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Nombre del propietario requerido')
        .customSanitizer(sanitizeText),
    body('propietarioEmail')
        .optional()
        .isEmail()
        .withMessage('Email del propietario inválido')
        .normalizeEmail(),
    body('propietarioTelefono')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Teléfono inválido')
];

// ============================================
// VALIDADORES DE MANTENIMIENTOS
// ============================================

const mantenimientoValidator = [
    body('titulo')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('El título debe tener entre 3 y 200 caracteres')
        .customSanitizer(sanitizeText),
    body('descripcion')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('La descripción debe tener entre 10 y 2000 caracteres')
        .customSanitizer(sanitizeText),
    body('tipo')
        .isIn(['SEMANAL', 'MENSUAL', 'EMERGENCIA'])
        .withMessage('Tipo debe ser SEMANAL, MENSUAL o EMERGENCIA'),
    body('area')
        .isIn(['COMUN', 'DEPARTAMENTO'])
        .withMessage('Área debe ser COMUN o DEPARTAMENTO'),
    body('departamentoId')
        .optional()
        .isUUID()
        .withMessage('ID de departamento inválido'),
    body('fechaInicio')
        .isISO8601()
        .withMessage('Fecha de inicio inválida'),
    body('fechaFin')
        .optional()
        .isISO8601()
        .withMessage('Fecha de fin inválida'),
    body('responsable')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .customSanitizer(sanitizeText),
    body('costo')
        .optional()
        .isDecimal({ decimal_digits: '0,2' })
        .withMessage('Costo debe ser un número válido'),
    body('notas')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .customSanitizer(sanitizeText)
];

// ============================================
// VALIDADORES DE PARÁMETROS
// ============================================

const uuidParamValidator = [
    param('id')
        .isUUID()
        .withMessage('ID inválido')
];

const paginacionValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página debe ser un número positivo'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Límite debe ser entre 1 y 100'),
    query('tipo')
        .optional()
        .isIn(['SEMANAL', 'MENSUAL', 'EMERGENCIA'])
        .withMessage('Tipo inválido'),
    query('area')
        .optional()
        .isIn(['COMUN', 'DEPARTAMENTO'])
        .withMessage('Área inválida')
];

module.exports = {
    loginValidator,
    cambiarPasswordValidator,
    registroAdminValidator,
    departamentoValidator,
    mantenimientoValidator,
    uuidParamValidator,
    paginacionValidator
};
