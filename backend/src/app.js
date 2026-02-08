// ============================================
// Aplicación Principal - Express Server
// Sistema de Mantenimiento para Condominio
// ============================================

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const departamentosRoutes = require('./routes/departamentos.routes');
const mantenimientosRoutes = require('./routes/mantenimientos.routes');
const publicRoutes = require('./routes/public.routes');
const imagenesRoutes = require('./routes/imagenes.routes');
const sugerenciasRoutes = require('./routes/sugerencias.routes');
const reportesRoutes = require('./routes/reportes.routes');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ============================================
// CONFIGURACIÓN PARA PROXY (Render, Vercel, etc.)
// ============================================
app.set('trust proxy', 1);

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

// Helmet - Headers de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// CORS - Configuración
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate Limiting estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 intentos de login
  message: {
    success: false,
    message: 'Demasiados intentos de login, espere 5 minutos'
  }
});

app.use(globalLimiter);

// ============================================
// PARSERS
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// RUTAS
// ============================================

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema de Mantenimiento - API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rutas de autenticación (con rate limiting estricto)
app.use('/api/auth', authLimiter, authRoutes);

// Rutas protegidas
app.use('/api/departamentos', departamentosRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);
app.use('/api/imagenes', imagenesRoutes);
app.use('/api/sugerencias', sugerenciasRoutes);
app.use('/api/reportes', reportesRoutes);

// Rutas públicas (áreas comunes)
app.use('/api/public', publicRoutes);

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejador global de errores
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🏢 Sistema de Mantenimiento iniciado`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ API disponible en: http://localhost:${PORT}/api`);
});

module.exports = app;
