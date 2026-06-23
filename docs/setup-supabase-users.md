# Setup de usuarios Supabase para ICM Empresarial

Esta guia explica como crear usuarios de prueba en Supabase Auth y vincularlos con filas en `public.profiles`.

La aplicacion no hardcodea usuarios ni contrasenas. Las credenciales se crean y administran desde Supabase.

## 1. Crear usuarios en Supabase Auth

1. Entrar al proyecto de Supabase.
2. Ir a `Authentication > Users`.
3. Seleccionar `Add user`.
4. Crear el usuario con email y una contrasena temporal.
5. Repetir el proceso para la profesora administradora y para cada empresa simulada.

No usar contrasenas reales en documentacion, commits ni issues.

## 2. Copiar el UUID de cada usuario

En `Authentication > Users`, abrir cada usuario creado y copiar su `User UID`.

Usar esos valores en los ejemplos SQL reemplazando:

```text
UUID_USUARIO_PROFESORA
UUID_USUARIO_EMPRESA
```

## 3. Buscar los UUID de empresas seed

En Supabase, ir a `SQL Editor` y ejecutar:

```sql
select id, nombre, slug, tipo
from public.empresas
order by tipo, nombre;
```

Copiar el `id` de la empresa que se quiere asociar al usuario.

Usar ese valor reemplazando:

```text
UUID_EMPRESA
```

## 4. Insertar filas en public.profiles

Cada usuario autenticado necesita una fila en `public.profiles`.

La profesora administradora puede tener `empresa_id = null` si solo va a supervisar.

Para que la profesora administradora pueda responder correspondencia, debe tener `empresa_id` asociado al organismo interno `Administracion ICM`.

Los usuarios con rol `empresa` deben tener `empresa_id` porque la base tiene una constraint que lo exige.

## 5. Crear un usuario profesora_admin

Reemplazar `UUID_USUARIO_PROFESORA` por el UUID real del usuario creado en Supabase Auth:

```sql
insert into public.profiles (
  id,
  nombre,
  rol,
  empresa_id
)
values (
  'UUID_USUARIO_PROFESORA',
  'Nombre Profesora',
  'profesora_admin',
  null
);
```

Si necesitás actualizar un perfil existente:

```sql
update public.profiles
set
  nombre = 'Nombre Profesora',
  rol = 'profesora_admin',
  empresa_id = null
where id = 'UUID_USUARIO_PROFESORA';
```

## 6. Crear usuarios empresa vinculados a empresas

Reemplazar `UUID_USUARIO_EMPRESA` y `UUID_EMPRESA` por los UUID reales:

```sql
insert into public.profiles (
  id,
  nombre,
  rol,
  empresa_id
)
values (
  'UUID_USUARIO_EMPRESA',
  'Nombre Alumno o Equipo',
  'empresa',
  'UUID_EMPRESA'
);
```

Ejemplo para consultar la vinculacion luego de insertar:

```sql
select
  p.id,
  p.nombre,
  p.rol,
  e.nombre as empresa,
  e.slug
from public.profiles p
left join public.empresas e on e.id = p.empresa_id
order by p.created_at desc;
```

## 7. Permitir que profesora_admin responda correspondencia

Buscar el organismo interno `Administracion ICM`:

```sql
select id, nombre, slug, tipo
from public.empresas
where slug = 'administracion-icm';
```

Copiar el `id` y usarlo como `UUID_EMPRESA`.

Si la profesora administradora solo va a supervisar, puede quedar con `empresa_id = null`.

Si tambien va a responder mensajes, asociar su perfil al organismo:

```sql
update public.profiles
set empresa_id = 'UUID_EMPRESA'
where id = 'UUID_USUARIO_PROFESORA'
  and rol = 'profesora_admin';
```

## 8. Probar login local

Crear `icm-empresarial-app/.env.local` con:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=URL_DEL_PROYECTO_SUPABASE
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CLAVE_PUBLICA_SUPABASE
SUPABASE_SECRET_KEY=CLAVE_SECRETA_SUPABASE
```

Instalar dependencias y ejecutar la app:

```bash
cd icm-empresarial-app
npm install
npm run dev
```

Si macOS muestra errores de limite de archivos abiertos al correr el servidor local, usar:

```bash
WATCHPACK_POLLING=true npm run dev
```

Abrir:

```text
http://localhost:3000/login
```

Resultados esperados:

- Un usuario con rol `empresa` entra a `/dashboard`.
- Un usuario con rol `profesora_admin` entra a `/admin`.
- Un usuario Auth sin fila en `public.profiles` no puede operar la plataforma.
