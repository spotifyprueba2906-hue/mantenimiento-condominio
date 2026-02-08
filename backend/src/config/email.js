// ============================================
// Configuración de Email - Resend
// ============================================

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Plantillas de email base
const emailTemplates = {
  // Email de bienvenida a propietario
  bienvenida: (nombre, departamento, passwordGenerica) => ({
    subject: '🏢 Bienvenido al Sistema de Mantenimiento - Grupo Ingcor',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #00B67A 0%, #0EA5E9 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .credentials { background: #f8fafc; border-left: 4px solid #00B67A; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .btn { display: inline-block; background: #00B67A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Grupo Ingcor</h1>
          </div>
          <div class="content">
            <h2>¡Bienvenido, ${nombre}!</h2>
            <p>Te damos la bienvenida al Sistema de Mantenimiento de tu condominio.</p>
            <p>Has sido registrado como propietario del <strong>Departamento ${departamento}</strong>.</p>
            
            <div class="credentials">
              <strong>Tus credenciales de acceso:</strong><br><br>
              <strong>Contraseña temporal:</strong> ${passwordGenerica}
            </div>
            
            <p>⚠️ <strong>Importante:</strong> Deberás cambiar tu contraseña en tu primer inicio de sesión.</p>
            
            <a href="${process.env.FRONTEND_URL}/login" class="btn">Iniciar Sesión</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grupo Ingcor - Mantenimiento Integral</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Notificación de nuevo mantenimiento
  nuevoMantenimiento: (titulo, descripcion, area, fecha) => ({
    subject: `🔧 Nuevo Mantenimiento Programado - ${area}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #00B67A 0%, #0EA5E9 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Nuevo Mantenimiento</h1>
          </div>
          <div class="content">
            <h2>${titulo}</h2>
            <div class="info-box">
              <p><strong>📍 Área:</strong> ${area}</p>
              <p><strong>📅 Fecha:</strong> ${fecha}</p>
              <p><strong>📝 Descripción:</strong></p>
              <p>${descripcion}</p>
            </div>
            <p>Puedes ver los detalles completos en el sistema.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grupo Ingcor - Mantenimiento Integral</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Recuperación de contraseña
  recuperarPassword: (nombre, token) => ({
    subject: '🔐 Recuperar Contraseña - Grupo Ingcor',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #00B67A 0%, #0EA5E9 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .btn { display: inline-block; background: #00B67A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperar Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola ${nombre},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            
            <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}" class="btn">Restablecer Contraseña</a>
            
            <div class="warning">
              <strong>⚠️ Este enlace expira en 1 hora.</strong><br>
              Si no solicitaste este cambio, ignora este correo.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grupo Ingcor - Mantenimiento Integral</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Función helper para enviar emails
async function sendEmail({ to, subject, html }) {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Grupo Ingcor <noreply@grupoingcor.com>',
      to,
      subject,
      html
    });
    return result;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
}

// Template para reporte PDF semanal
function getReportePDFTemplate(nombre, fechaInicio, fechaFin, urlPdf) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #00B67A 0%, #0EA5E9 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .btn { display: inline-block; background: #00B67A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Reporte de Mantenimiento Semanal</h1>
        </div>
        <div class="content">
          <p>Hola ${nombre},</p>
          <p>Te compartimos el reporte de mantenimiento correspondiente a la semana del <strong>${fechaInicio}</strong> al <strong>${fechaFin}</strong>.</p>
          
          <div class="info-box">
            <p>El reporte incluye:</p>
            <ul>
              <li>Fotografías de los trabajos realizados</li>
              <li>Descripción de cada actividad</li>
              <li>Clasificación por tipo de mantenimiento</li>
            </ul>
          </div>
          
          <a href="${urlPdf}" class="btn">📥 Descargar Reporte PDF</a>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            También puedes acceder a este reporte desde tu perfil en el sistema.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Grupo Ingcor - Mantenimiento Integral</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  resend,
  emailTemplates,
  sendEmail,
  getReportePDFTemplate
};
