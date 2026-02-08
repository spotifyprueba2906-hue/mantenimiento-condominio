// ============================================
// Configuración de Base de Datos - Prisma Client
// ============================================

const { PrismaClient } = require('@prisma/client');

// Singleton para evitar múltiples conexiones en desarrollo
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

module.exports = prisma;
