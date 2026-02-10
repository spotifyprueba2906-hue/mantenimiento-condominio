// ============================================
// Servicio de Generación de PDF
// Sistema de Mantenimiento para Condominio
// ============================================

const PDFDocument = require('pdfkit');
const { cloudinary } = require('../config/cloudinary');
const https = require('https');
const http = require('http');

// Logo Grupo Ingcor en SVG (convertido a path para PDFKit)
const LOGO_SVG = `
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#00B67A"/>
  <text x="50" y="62" font-family="Helvetica" font-size="32" font-weight="bold" fill="white" text-anchor="middle">G</text>
</svg>
`;

// Información de la empresa
const EMPRESA_INFO = {
    nombre: 'Grupo Ingcor',
    subtitulo: 'Ingeniería en Construcción y Remodelación',
    responsable: 'Ing. José María Salgado Ruiz',
    direccion: 'Costera M. Alemán 101 Fracc. Las Playas, Acapulco Guerrero',
    telefono: 'Móvil 744 4149689',
    email: 'josemariasr45@gmail.com',
    ciudad: 'Acapulco Guerrero'
};

/**
 * Obtiene una imagen de URL como buffer
 */
async function getImageBuffer(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Formatea fecha en español
 */
function formatearFecha(fecha) {
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const d = new Date(fecha);
    return `${EMPRESA_INFO.ciudad} a ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * Categorías en español legible
 */
const CATEGORIAS_LABEL = {
    REZANES: 'REZANES',
    IMPERMEABILIZACION: 'IMPERMEABILIZACION',
    PINTURA: 'PINTURA',
    LIMPIEZA: 'LIMPIEZA',
    OTRA: 'OTROS TRABAJOS'
};

/**
 * Genera un PDF de reporte fotográfico
 * @param {Object} options - Opciones del reporte
 * @param {string} options.titulo - Título del reporte
 * @param {string} options.destinatario - Nombre del destinatario
 * @param {string} options.cargo - Cargo del destinatario
 * @param {string} options.descripcion - Descripción del trabajo
 * @param {Date} options.fecha - Fecha del reporte
 * @param {Array} options.imagenesPorCategoria - Imágenes agrupadas por categoría
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generarReportePDF(options) {
    const {
        titulo = 'REPORTE FOTOGRÁFICO',
        condominio = 'CONDOMINIO',
        destinatario = '',
        cargo = 'Gerente de Mantenimiento',
        descripcion = '',
        fecha = new Date(),
        imagenesPorCategoria = {}
    } = options;

    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'LETTER',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // ========== PÁGINA 1: PORTADA ==========

            // Logo (círculo verde con G)
            doc.save();
            doc.circle(100, 80, 30).fill('#00B67A');
            doc.fontSize(24).fillColor('white').text('G', 88, 68);
            doc.restore();

            // Nombre empresa
            doc.fillColor('#333333');
            doc.fontSize(16).font('Helvetica-Bold').text('GRUPO INGCOR', 140, 62);
            doc.fontSize(8).font('Helvetica').text('INGENIERÍA EN CONSTRUCCIÓN Y REMODELACIÓN', 140, 82);

            // Título del reporte
            doc.moveDown(2);
            doc.fontSize(20).font('Helvetica-Bold')
                .fillColor('#00B67A')
                .text(titulo, { align: 'center' });

            // Fecha
            doc.moveDown();
            doc.fontSize(11).font('Helvetica').fillColor('#333333')
                .text(formatearFecha(fecha), { align: 'right' });

            // Destinatario
            doc.moveDown(2);
            doc.fontSize(11).font('Helvetica-Bold').text(condominio);
            if (destinatario) {
                doc.font('Helvetica').text(`At'n ${destinatario}`);
                doc.text(cargo);
            }

            // Descripción
            if (descripcion) {
                doc.moveDown();
                doc.fontSize(10).font('Helvetica')
                    .text('Por medio del presente se hace constar los trabajos realizados de acuerdo al plan de trabajo del cual consta:');
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').text(descripcion);
            }

            // Texto de anexo
            doc.moveDown(2);
            doc.fontSize(10).font('Helvetica-Bold')
                .text('Anexo fotografías como medio de evidencia.');
            doc.moveDown();
            doc.font('Helvetica')
                .text(`Responsable ${EMPRESA_INFO.responsable}.`);

            // ========== PÁGINAS DE CATEGORÍAS ==========

            const categorias = Object.keys(imagenesPorCategoria);

            for (const categoria of categorias) {
                const imagenes = imagenesPorCategoria[categoria];
                if (!imagenes || imagenes.length === 0) continue;

                doc.addPage();

                // Título de categoría
                const categoriaLabel = CATEGORIAS_LABEL[categoria] || categoria;
                doc.fontSize(14).font('Helvetica-Bold')
                    .fillColor('#333333')
                    .text(categoriaLabel, 50, 50);

                let yPosition = 80;
                const pageWidth = doc.page.width - 100; // Márgenes de 50 cada lado
                const imageWidth = (pageWidth - 20) / 2; // 2 imágenes con 20px de separación
                const imageHeight = 180;

                // Renderizar imágenes en pares
                for (let i = 0; i < imagenes.length; i += 2) {
                    // Verificar si necesitamos nueva página
                    if (yPosition + imageHeight + 50 > doc.page.height - 80) {
                        doc.addPage();
                        yPosition = 50;
                    }

                    // Primera imagen
                    try {
                        const img1Buffer = await getImageBuffer(imagenes[i].urlCloudinary);
                        doc.image(img1Buffer, 50, yPosition, {
                            width: imageWidth,
                            height: imageHeight,
                            fit: [imageWidth, imageHeight]
                        });
                    } catch (e) {
                        // Placeholder si falla la imagen
                        doc.rect(50, yPosition, imageWidth, imageHeight).stroke('#cccccc');
                        doc.fontSize(10).fillColor('#999999').text('Imagen no disponible', 50, yPosition + 80, { width: imageWidth, align: 'center' });
                    }

                    // Segunda imagen (si existe)
                    if (imagenes[i + 1]) {
                        try {
                            const img2Buffer = await getImageBuffer(imagenes[i + 1].urlCloudinary);
                            doc.image(img2Buffer, 50 + imageWidth + 20, yPosition, {
                                width: imageWidth,
                                height: imageHeight,
                                fit: [imageWidth, imageHeight]
                            });
                        } catch (e) {
                            doc.rect(50 + imageWidth + 20, yPosition, imageWidth, imageHeight).stroke('#cccccc');
                        }
                    }

                    yPosition += imageHeight + 30;
                }

                // Pie de página con info de contacto
                doc.fontSize(8).font('Helvetica').fillColor('#666666')
                    .text(
                        `${EMPRESA_INFO.direccion}  ${EMPRESA_INFO.telefono}  ${EMPRESA_INFO.email}`,
                        50,
                        doc.page.height - 40,
                        { align: 'center' }
                    );
            }

            // ========== PÁGINA FINAL: FIRMAS ==========
            doc.addPage();

            const firmaY = 300;
            const firmaWidth = 200;

            // Firma izquierda
            doc.fontSize(10).font('Helvetica-Bold')
                .fillColor('#333333')
                .text('Firma de conformidad.', 80, firmaY - 30);
            doc.text(destinatario || 'Gerente del Condominio', 80, firmaY - 15);
            doc.moveTo(80, firmaY + 30).lineTo(80 + firmaWidth, firmaY + 30).stroke();

            // Firma derecha
            doc.text('Firma de conformidad.', 330, firmaY - 30);
            doc.text(EMPRESA_INFO.responsable, 330, firmaY - 15);
            doc.moveTo(330, firmaY + 30).lineTo(330 + firmaWidth, firmaY + 30).stroke();

            // Pie de página
            doc.fontSize(8).font('Helvetica').fillColor('#666666')
                .text(
                    `${EMPRESA_INFO.direccion}  ${EMPRESA_INFO.telefono}  ${EMPRESA_INFO.email}`,
                    50,
                    doc.page.height - 40,
                    { align: 'center' }
                );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Sube el PDF generado a Cloudinary
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<Object>} - Resultado de Cloudinary
 */
async function subirPDFaCloudinary(pdfBuffer, filename) {
    if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('El buffer del PDF está vacío');
    }
    console.log(`Subiendo PDF a Cloudinary: ${filename}, Tamaño: ${pdfBuffer.length} bytes`);

    // Limpiar extensión si ya existe para evitar duplicados y asegurar formato limpio
    const baseName = filename.replace(/\.pdf$/i, '');
    const publicId = `${baseName}.pdf`;

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto', // Cambiar a auto para evitar restricción "untrusted" de raw files
                folder: 'mantenimiento/reportes',
                public_id: publicId
            },
            (error, result) => {
                if (error) {
                    console.error('Error subiendo a Cloudinary:', error);
                    reject(error);
                } else {
                    console.log('PDF subido correctamente:', result.secure_url);
                    resolve(result);
                }
            }
        );

        uploadStream.end(pdfBuffer);
    });
}

/**
 * Elimina un PDF de Cloudinary
 * @param {string} publicId - Public ID del archivo
 */
async function eliminarPDFdeCloudinary(publicId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(
            publicId,
            { resource_type: 'raw' }, // Importante: especificar raw
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
    });
}

module.exports = {
    generarReportePDF,
    subirPDFaCloudinary,
    eliminarPDFdeCloudinary,
    EMPRESA_INFO,
    CATEGORIAS_LABEL
};
