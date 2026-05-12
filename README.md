# TechSolutions

Sistema web full stack para la gestión empresarial de clientes, grupos, proyectos, tareas, reportes y notificaciones. El sistema cuenta con panel administrativo, portal para clientes, autenticación por roles, recuperación de contraseña por correo, reportes exportables en PDF y soporte para instalación como PWA en dispositivos móviles.

---

## Información general

**Nombre del proyecto:** TechSolutions  
**Tipo de sistema:** Aplicación web full stack  
**Modalidad:** Web responsive + PWA instalable  
**Repositorio:** https://github.com/ricbac/techsolutions_FullStack.git  
**Sistema desplegado:** https://techsolutions-full-stack.vercel.app/login  
**API desplegada:** https://techsolutions-api-nmwj.onrender.com/api

El sistema fue desarrollado para administrar proyectos empresariales, asignar clientes de forma individual o por grupos, controlar tareas, consultar avances, recibir notificaciones y generar reportes para apoyo en la toma de decisiones.

---

## Tecnologías utilizadas

### Frontend

- React
- Vite
- React Router DOM
- Tailwind CSS
- Axios
- Recharts
- jsPDF
- html2canvas
- Lucide React
- PWA mediante `manifest.webmanifest` y Service Worker

### Backend

- Node.js
- Express.js
- PostgreSQL
- Supabase como base de datos
- JWT para autenticación
- bcryptjs para cifrado de contraseñas
- Nodemailer / Brevo para recuperación de contraseña por correo
- CORS
- dotenv

### Despliegue

- Frontend desplegado en Vercel
- Backend desplegado en Render
- Base de datos alojada en Supabase
- Repositorio alojado en GitHub

---

## Funcionalidades principales

### Autenticación y seguridad

- Inicio de sesión con correo y contraseña.
- Autenticación mediante token JWT.
- Separación de acceso por roles: Administrador y Cliente.
- Rutas protegidas en frontend y backend.
- Contraseñas almacenadas con hash bcrypt.
- Recuperación de contraseña mediante enlace enviado por correo.
- Cambio de contraseña desde el perfil del usuario.

### Panel Administrador

- Inicio con métricas generales del sistema.
- Gestión de clientes.
- Gestión de grupos de clientes.
- Gestión de proyectos.
- Asignación de clientes individuales y grupos a proyectos.
- Validación para evitar duplicar clientes ya incluidos por grupo.
- Gestión de tareas por proyecto y cliente asignado.
- Vista de detalle de proyecto con métricas, clientes relacionados, grupos, tareas y diagrama de Gantt.
- Reportes en PDF: general, por proyecto, por cliente, por grupo, tareas vencidas y productividad.
- Notificaciones del sistema.
- Perfil del administrador.

### Portal Cliente

- Inicio con resumen de proyectos y tareas asignadas.
- Consulta de proyectos relacionados.
- Consulta de tareas asignadas.
- Marcar tareas como completadas.
- Notificaciones propias.
- Perfil del cliente y cambio de contraseña.

### PWA / Uso móvil

- Interfaz responsive adaptable a escritorio, tablet y celular.
- Instalación desde Safari en iPhone como aplicación en pantalla de inicio.
- Manifest configurado con nombre, íconos y color de tema.
- Service Worker configurado para cache básico del shell de la aplicación.
- Las llamadas a la API no se cachean para mantener datos actualizados.

---

## Estructura del proyecto

```txt
techsolutions-v2/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── database/
│   │   ├── schema.sql
│   │   ├── grupos.sql
│   │   └── notificaciones_patch.sql
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   ├── manifest.webmanifest
│   │   ├── sw.js
│   │   └── icons/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── cliente/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Requisitos para ejecución local

Antes de ejecutar el proyecto se necesita tener instalado:

- Node.js
- npm
- Git
- Acceso a una base de datos PostgreSQL o Supabase
- Editor de código, preferiblemente Visual Studio Code

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/ricbac/techsolutions_FullStack.git
cd techsolutions_FullStack
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

---

## Configuración de la base de datos

El sistema utiliza PostgreSQL mediante Supabase.

En Supabase se deben ejecutar los scripts SQL ubicados en la carpeta:

```txt
backend/database/
```

Orden recomendado:

```txt
1. schema.sql
2. grupos.sql
3. notificaciones_patch.sql
```

Estos scripts crean las tablas principales del sistema, relaciones, roles, usuario administrador inicial, grupos, notificaciones y ajustes necesarios para el funcionamiento completo.

---

## Variables de entorno

### Backend

Crear un archivo `.env` dentro de la carpeta `backend`.

Ejemplo:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://usuario:password@host:puerto/database
JWT_SECRET=clave_segura_para_jwt
FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario_smtp
SMTP_PASS=password_smtp
SMTP_FROM="TechSolutions <correo@dominio.com>"
BREVO_API_KEY=api_key_de_brevo
```

Para producción, `FRONTEND_URL` debe apuntar al dominio de Vercel y `DATABASE_URL` debe usar la cadena de conexión de Supabase compatible con el entorno de Render.

### Frontend

Crear un archivo `.env` dentro de la carpeta `frontend`.

```env
VITE_API_URL=http://localhost:4000/api
```

Para producción en Vercel:

```env
VITE_API_URL=https://techsolutions-api-nmwj.onrender.com/api
```

---

## Ejecución local

### Backend

Desde la carpeta `backend`:

```bash
npm run dev
```

El backend se ejecutará en:

```txt
http://localhost:4000
```

### Frontend

Desde la carpeta `frontend`:

```bash
npm run dev
```

El frontend se ejecutará normalmente en:

```txt
http://localhost:5173
```

---

## Comandos útiles

### Validar backend

```bash
node --check server.js
```

### Compilar frontend

```bash
npm run build
```

En PowerShell, si existe bloqueo de scripts con `npm.ps1`, se puede usar:

```powershell
npm.cmd run build
```

---

## Endpoints principales

### Autenticación

```txt
POST /api/auth/login
GET  /api/auth/perfil
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Clientes

```txt
GET    /api/clientes
GET    /api/clientes/:id
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id
```

### Grupos

```txt
GET    /api/grupos
GET    /api/grupos/:id
POST   /api/grupos
PUT    /api/grupos/:id
DELETE /api/grupos/:id
GET    /api/grupos/opciones/clientes
```

### Proyectos

```txt
GET    /api/proyectos
GET    /api/proyectos/:id
POST   /api/proyectos
PUT    /api/proyectos/:id
DELETE /api/proyectos/:id
GET    /api/proyectos/opciones/clientes
GET    /api/proyectos/opciones/grupos
```

### Tareas

```txt
GET    /api/tareas
GET    /api/tareas/:id
POST   /api/tareas
PUT    /api/tareas/:id
DELETE /api/tareas/:id
GET    /api/tareas/opciones/proyectos
GET    /api/tareas/opciones/clientes
```

### Cliente

```txt
GET /api/cliente/dashboard
GET /api/cliente/proyectos
GET /api/cliente/proyectos/:id
GET /api/cliente/tareas
PUT /api/cliente/tareas/:id/completar
```

### Reportes

```txt
GET /api/reportes/general
GET /api/reportes/proyecto/:id
GET /api/reportes/cliente/:id
GET /api/reportes/grupo/:id
GET /api/reportes/tareas-vencidas
GET /api/reportes/productividad
```

### Notificaciones

```txt
GET    /api/notificaciones
GET    /api/notificaciones/no-leidas/count
PUT    /api/notificaciones/:id/leer
PUT    /api/notificaciones/leer-todas
DELETE /api/notificaciones/:id
```

---

## Credenciales de prueba

### Administrador

```txt
Correo: admin@techsolutions.com
Contraseña: Admin12345
```

### Cliente de prueba

```txt
Correo: carlos.lopez@demo.com
Contraseña: Cliente123
```

> Nota: Las credenciales pueden cambiar según los datos cargados en la base de datos utilizada para la presentación.

---

## Despliegue

### Backend en Render

El backend se despliega como servicio Node.js.

Configuración general:

```txt
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Variables necesarias en Render:

```txt
DATABASE_URL
FRONTEND_URL
JWT_SECRET
NODE_ENV
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
SMTP_FROM
BREVO_API_KEY
```

### Frontend en Vercel

El frontend se despliega como proyecto Vite.

Configuración general:

```txt
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Variable necesaria en Vercel:

```txt
VITE_API_URL=https://techsolutions-api-nmwj.onrender.com/api
```

---

## Recuperación de contraseña

El sistema permite restablecer contraseña mediante correo electrónico.

Flujo general:

1. El usuario ingresa a la opción “¿Olvidaste tu contraseña?”.
2. Escribe su correo registrado.
3. El sistema genera un token temporal.
4. Se envía un enlace de recuperación al correo del usuario.
5. El usuario accede al enlace y define una nueva contraseña.
6. El token queda invalidado después del uso o al vencer el tiempo configurado.

---

## Instalación como PWA en iPhone

Para instalar el sistema como aplicación en iPhone:

1. Abrir el sistema desde Safari.
2. Presionar el botón de compartir.
3. Seleccionar “Agregar a pantalla de inicio”.
4. Confirmar el nombre TechSolutions.
5. Abrir la aplicación desde el ícono creado.

La aplicación requiere conexión a internet para consultar la información actualizada del sistema.

---

## Consideraciones importantes

- El sistema usa roles para separar las funciones del administrador y del cliente.
- Los clientes pueden estar asociados a proyectos de forma individual o mediante grupos.
- El progreso de los proyectos se calcula con base en las tareas completadas.
- Los reportes se generan desde la información registrada en la base de datos.
- Las notificaciones se crean automáticamente en eventos importantes del sistema.
- El sistema está preparado para usarse desde escritorio y dispositivos móviles.

---

## Autor

**Ricardo Antonio Bac Bol**  
Universidad de San Carlos de Guatemala - CUNOR  
Práctica Intermedia  
Proyecto: Desarrollo Full Stack - TechSolutions

---

## Estado del proyecto

Proyecto funcional y desplegado para presentación académica. Incluye frontend, backend, base de datos, autenticación, recuperación de contraseña, reportes, notificaciones y soporte PWA.
