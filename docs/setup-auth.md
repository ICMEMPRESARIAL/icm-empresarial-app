# Configuración de Supabase Auth

## Site URL

En Supabase, ir a **Authentication > URL Configuration** y configurar:

```text
https://app.icmempresarial.com.ar
```

Para desarrollo local, usar:

```text
http://localhost:3000
```

## Redirect URLs

Agregar estas URLs permitidas:

```text
http://localhost:3000/update-password
https://app.icmempresarial.com.ar/update-password
```

## Registro de alumnos

Los alumnos se registran desde:

```text
/registro
```

El alta crea una cuenta de Supabase Auth y guarda una solicitud en
`public.solicitudes_registro`. La cuenta queda con `profiles.estado = 'pendiente'`
hasta aprobación docente.

## Recuperación de contraseña

La recuperación se inicia en:

```text
/recuperar-password
```

Supabase envía un enlace al email del usuario. Ese enlace debe volver a:

```text
/update-password
```

## Templates de email

En **Authentication > Email Templates**, revisar:

- Confirm signup
- Reset password

Usar textos claros para alumnos y mantener los enlaces generados por Supabase.
