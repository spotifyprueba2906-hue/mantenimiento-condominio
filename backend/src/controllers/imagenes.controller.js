// ============================================
// Controlador de Imágenes
// ============================================

const prisma = require('../config/database');
const { deleteImage } = require('../config/cloudinary');

/**
 * POST /api/imagenes/mantenimiento/:id
 * Subir imágenes a un mantenimiento
 */
const subirImagenes = async (req, res, next) => {
    try {
        const { id: mantenimientoId } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe subir al menos una imagen'
            });
        }

        // Verificar que el mantenimiento existe
        const mantenimiento = await prisma.mantenimiento.findUnique({
            where: { id: mantenimientoId }
        });

        if (!mantenimiento) {
            return res.status(404).json({
                success: false,
                message: 'Mantenimiento no encontrado'
            });
        }

        // Obtener el orden máximo actual
        const ultimaImagen = await prisma.imagen.findFirst({
            where: { mantenimientoId },
            orderBy: { orden: 'desc' }
        });
        let ordenActual = ultimaImagen ? ultimaImagen.orden : -1;

        // Crear registros de imágenes
        const imagenesData = files.map((file, index) => ({
            mantenimientoId,
            urlCloudinary: file.path,
            publicId: file.filename,
            descripcion: req.body.descripciones?.[index] || null,
            orden: ++ordenActual
        }));

        const imagenes = await prisma.imagen.createMany({
            data: imagenesData
        });

        // Obtener las imágenes creadas
        const imagenesCreadas = await prisma.imagen.findMany({
            where: { mantenimientoId },
            orderBy: { orden: 'asc' }
        });

        res.status(201).json({
            success: true,
            message: `${files.length} imagen(es) subida(s) correctamente`,
            data: imagenesCreadas
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/imagenes/:id
 * Eliminar imagen
 */
const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        const imagen = await prisma.imagen.findUnique({
            where: { id }
        });

        if (!imagen) {
            return res.status(404).json({
                success: false,
                message: 'Imagen no encontrada'
            });
        }

        // Eliminar de Cloudinary
        try {
            await deleteImage(imagen.publicId);
        } catch (cloudinaryError) {
            console.error('Error eliminando de Cloudinary:', cloudinaryError);
            // Continuar aunque falle en Cloudinary
        }

        // Eliminar de base de datos
        await prisma.imagen.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Imagen eliminada correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/imagenes/:id/orden
 * Actualizar orden de imagen
 */
const actualizarOrden = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { orden } = req.body;

        if (typeof orden !== 'number' || orden < 0) {
            return res.status(400).json({
                success: false,
                message: 'Orden inválido'
            });
        }

        const imagen = await prisma.imagen.update({
            where: { id },
            data: { orden }
        });

        res.json({
            success: true,
            message: 'Orden actualizado correctamente',
            data: imagen
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    subirImagenes,
    eliminar,
    actualizarOrden
};
