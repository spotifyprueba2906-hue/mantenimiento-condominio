# 🏢 Sistema de Mantenimiento para Condominio

Sistema web completo para gestión de mantenimiento de condominios desarrollado para **Grupo Ingcor**.

## 🚀 Características

- ✅ **Gestión de Mantenimientos** - Registro semanal/mensual con imágenes
- ✅ **Departamentos Independientes** - Cada propietario accede solo a su información
- ✅ **Áreas Comunes Públicas** - Sección accesible sin login
- ✅ **Sistema de Roles** - Administrador y Propietario
- ✅ **Seguridad Avanzada** - JWT, bcrypt, rate limiting, validación
- ✅ **Envío de Emails** - Notificaciones automáticas
- ✅ **Almacenamiento en la Nube** - Imágenes en Cloudinary

## 📁 Estructura del Proyecto

```
Mantenimiento/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── config/         # Configuraciones (DB, Cloudinary, Email)
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── middleware/     # Auth, validación, errores
│   │   ├── routes/         # Definición de endpoints
│   │   ├── services/       # Servicios externos
│   │   ├── validators/     # Esquemas de validación
│   │   └── app.js          # Entrada principal
│   ├── prisma/
│   │   └── schema.prisma   # Modelo de base de datos
│   └── package.json
│
└── frontend/               # React + Vite
    ├── src/
    │   ├── components/     # Componentes reutilizables
    │   ├── context/        # Contexto de autenticación
    │   ├── layouts/        # Layouts de páginas
    │   ├── pages/          # Páginas de la aplicación
    │   ├── services/       # Cliente API
    │   └── styles/         # CSS del sistema de diseño
    └── package.json
```

## 🛠️ Instalación

### Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta en [Supabase](https://supabase.com) (DB gratuita)
- Cuenta en [Cloudinary](https://cloudinary.com) (imágenes gratuitas)
- Cuenta en [Resend](https://resend.com) (emails gratuitos)

### 1. Clonar y configurar Backend

```bash
cd backend
npm install

# Copiar archivo de ejemplo y configurar variables
cp .env.example .env
# Editar .env con tus credenciales
```

### 2. Configurar Base de Datos

```bash
# Generar cliente de Prisma
npm run db:generate

# Crear tablas en la base de datos
npm run db:push
```

### 3. Crear Usuario Administrador

Ejecutar en la consola de Supabase o con Prisma Studio:

```sql
INSERT INTO usuarios (id, email, password_hash, nombre, rol, password_cambiada, activo)
VALUES (
  gen_random_uuid(),
  'admin@tudominio.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4oaC3sHHvQnX6VH2', -- Password: Admin123!
  'Administrador',
  'ADMIN',
  true,
  true
);
```

### 4. Iniciar Backend

```bash
npm run dev
# API disponible en http://localhost:3000
```

### 5. Configurar e Iniciar Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend disponible en http://localhost:5173
```

## 🌐 Despliegue Gratuito

### Backend en Render.com

1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Build command: `npm install && npm run db:generate`
4. Start command: `npm start`

### Frontend en Vercel

1. Conectar repositorio
2. Framework preset: Vite
3. Configurar variable `VITE_API_URL` con URL del backend

### Base de Datos en Supabase

1. Crear proyecto en Supabase
2. Copiar `DATABASE_URL` del panel de configuración
3. Usar en `.env` del backend

## 📱 Uso del Sistema

### Flujo del Administrador

1. Iniciar sesión con credenciales de admin
2. Crear departamentos con datos del propietario
3. Crear usuario para cada propietario (envía email con contraseña)
4. Registrar mantenimientos semanales/mensuales
5. Subir fotos de los trabajos realizados

### Flujo del Propietario

1. Recibir email con credenciales
2. Iniciar sesión con contraseña temporal
3. Cambiar contraseña en primer acceso
4. Ver mantenimientos de su departamento
5. Consultar mantenimientos de áreas comunes

### Visitantes

1. Acceder a `/areas-comunes` sin login
2. Ver historial de mantenimientos públicos
3. Filtrar por tipo (semanal/mensual)

## 🔒 Seguridad Implementada

| Medida | Descripción |
|--------|-------------|
| **JWT** | Tokens de acceso de 15 min + refresh tokens |
| **Bcrypt** | Hash de contraseñas con 12 salt rounds |
| **Rate Limiting** | 5 intentos de login por 15 min |
| **Helmet** | Headers de seguridad HTTP |
| **CORS** | Configuración restrictiva |
| **Validación** | Sanitización de toda entrada |
| **Prisma** | Consultas parametrizadas (no SQL injection) |

## 💰 Costos de Servicios

| Servicio | Plan Gratuito | Costo si Crece |
|----------|---------------|----------------|
| Supabase | 500MB DB | $25/mes |
| Cloudinary | 25GB storage | $89/mes |
| Render | 750 hrs/mes | $7/mes |
| Resend | 3000 emails/mes | $20/mes |

## 📞 Soporte

Para dudas o problemas, contactar al desarrollador.

---

**Desarrollado para Grupo Ingcor** 🏗️
