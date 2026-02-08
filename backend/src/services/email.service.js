// ============================================
// Servicio de Email
// ============================================

const { resend, emailTemplates } = require('../config/email');

/**
 * Enviar email de bienvenida a propietario
 */
const enviarBienvenida = async (email, nombre, departamento, passwordGenerica) => {
    // Si no hay Resend configurado, solo loguear
    if (!resend) {
        console.log(`📧 [Email no enviado - Resend no configurado] Bienvenida para: ${email}`);
        return { success: true, message: 'Email logged (Resend not configured)' };
    }

    try {
        const template = emailTemplates.bienvenida(nombre, departamento, passwordGenerica);

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Grupo Ingcor <onboarding@resend.dev>',
            to: email,
            subject: template.subject,
            html: template.html
        });

        if (error) {
            console.error('Error enviando email de bienvenida:', error);
            throw error;
        }

        console.log('Email de bienvenida enviado:', data.id);
        return data;
    } catch (error) {
        console.error('Error en servicio de email:', error);
        throw error;
    }
};

/**
 * Enviar notificación de nuevo mantenimiento
 */
const enviarNotificacionMantenimiento = async (emails, titulo, descripcion, area, fecha) => {
    // Si no hay Resend configurado, solo loguear
    if (!resend) {
        console.log(`📧 [Email no enviado - Resend no configurado] Notificación a: ${emails.length} destinatarios`);
        return { enviados: 0, total: emails.length, message: 'Resend not configured' };
    }

    try {
        const template = emailTemplates.nuevoMantenimiento(titulo, descripcion, area, fecha);

        // Enviar a múltiples destinatarios
        const promises = emails.map(email =>
            resend.emails.send({
                from: process.env.EMAIL_FROM || 'Grupo Ingcor <onboarding@resend.dev>',
                to: email,
                subject: template.subject,
                html: template.html
            })
        );

        const results = await Promise.allSettled(promises);

        const enviados = results.filter(r => r.status === 'fulfilled').length;
        console.log(`Notificaciones enviadas: ${enviados}/${emails.length}`);

        return { enviados, total: emails.length };
    } catch (error) {
        console.error('Error enviando notificaciones:', error);
        throw error;
    }
};

/**
 * Enviar email de recuperación de contraseña
 */
const enviarRecuperarPassword = async (email, nombre, token) => {
    // Si no hay Resend configurado, solo loguear
    if (!resend) {
        console.log(`📧 [Email no enviado - Resend no configurado] Recuperación para: ${email}`);
        return { success: true, message: 'Email logged (Resend not configured)' };
    }

    try {
        const template = emailTemplates.recuperarPassword(nombre, token);

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Grupo Ingcor <onboarding@resend.dev>',
            to: email,
            subject: template.subject,
            html: template.html
        });

        if (error) {
            console.error('Error enviando email de recuperación:', error);
            throw error;
        }

        console.log('Email de recuperación enviado:', data.id);
        return data;
    } catch (error) {
        console.error('Error en servicio de email:', error);
        throw error;
    }
};

module.exports = {
    enviarBienvenida,
    enviarNotificacionMantenimiento,
    enviarRecuperarPassword
};
