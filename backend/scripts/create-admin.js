// Script para crear usuario admin
// Ejecutar: node scripts/create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@grupoingcor.com';
    const password = 'Admin123!';
    const nombre = 'Administrador';

    // Generar hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('Hash generado:', passwordHash);

    // Verificar que el hash funciona
    const matches = await bcrypt.compare(password, passwordHash);
    console.log('Verificación del hash:', matches ? '✅ CORRECTO' : '❌ ERROR');

    // Eliminar usuario existente si existe
    await prisma.usuario.deleteMany({
        where: { email }
    });

    // Crear usuario
    const usuario = await prisma.usuario.create({
        data: {
            email,
            passwordHash,
            nombre,
            rol: 'ADMIN',
            passwordCambiada: true,
            activo: true
        }
    });

    console.log('✅ Usuario admin creado:', usuario.email);
    console.log('');
    console.log('Credenciales:');
    console.log('  Email:', email);
    console.log('  Password:', password);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
