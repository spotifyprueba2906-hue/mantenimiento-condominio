// ============================================
// Manejador Global de Errores
// ============================================

/**
 * Middleware para manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Errores de Prisma
    if (err.code) {
        switch (err.code) {
            case 'P2002':
                return res.status(409).json({
                    success: false,
                    message: 'El registro ya existe (dato duplicado)'
                });
            case 'P2025':
                return res.status(404).json({
                    success: false,
                    message: 'Registro no encontrado'
                });
            case 'P2003':
                return res.status(400).json({
                    success: false,
                    message: 'Error de referencia: registro relacionado no existe'
                });
        }
    }

    // Errores de Multer (subida de archivos)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'El archivo excede el tamaño máximo permitido (5MB)'
        });
    }

    if (err.message && err.message.includes('Tipo de archivo no permitido')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Errores de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.errors
        });
    }

    // Error genérico
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message;

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = { errorHandler };
