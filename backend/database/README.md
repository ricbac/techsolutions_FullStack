# Base de datos TechSolutions v2.0

Este directorio contiene el esquema inicial para Supabase PostgreSQL.

## Ejecutar `schema.sql` en Supabase

1. Abre Supabase en `https://supabase.com` e ingresa a tu cuenta.
2. Selecciona el proyecto donde estara la base de datos de TechSolutions v2.0.
3. En el menu lateral, entra a **SQL Editor**.
4. Crea una nueva consulta con **New query**.
5. Abre el archivo `backend/database/schema.sql`, copia todo su contenido y pegalo en el editor SQL.
6. Ejecuta la consulta con **Run**.

El script elimina las tablas existentes del sistema y las vuelve a crear, por lo que debe usarse con cuidado cuando ya existan datos reales.

## Usuario administrador inicial

El script crea este usuario administrador:

- Correo: `admin@techsolutions.com`
- Contrasena temporal: `Admin12345`
- Rol: `Administrador`

La contrasena no se guarda en texto plano. En `schema.sql` se inserta un hash bcrypt ya generado.

## Variables de entorno del backend

Crea un archivo `backend/.env` tomando como base `backend/.env.example`.

Variables necesarias:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://usuario:password@host:5432/base_de_datos
JWT_SECRET=valor_seguro_para_firmar_tokens
```

En Supabase puedes encontrar la cadena de conexion en:

1. **Project Settings**
2. **Database**
3. **Connection string**

Usa la cadena correspondiente a PostgreSQL y reemplaza la contrasena si Supabase la muestra como marcador.
