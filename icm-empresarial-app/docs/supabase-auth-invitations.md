# Supabase Auth invitations

El flujo esperado para invitaciones es:

1. ICM envia `redirectTo` como `/auth/confirm?next=/update-password?invite=1`.
2. Supabase valida el enlace de email.
3. La app confirma el codigo o `token_hash`, guarda las cookies de sesion y redirige a `/update-password?invite=1`.
4. El usuario crea su contraseña y queda autenticado.
5. La app redirige a `/onboarding`.

## Template recomendado

En Supabase, editar **Authentication > Email Templates > Invite user** y usar un enlace que llegue a `/auth/confirm`, no directo a `/update-password`.

Si el HTML usa la URL dinamica que manda la app:

```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=invite">Crear contraseña</a>
```

La app envia `{{ .RedirectTo }}` con este formato:

```text
https://app.icmempresarial.com.ar/auth/confirm?next=%2Fupdate-password%3Finvite%3D1
```

Si se prefiere no depender de `RedirectTo`, usar:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=invite&amp;next=%2Fupdate-password%3Finvite%3D1">Crear contraseña</a>
```

## Importante

No usar un enlace hardcodeado directo a:

```text
/update-password?invite=1
```

Ese destino muestra el formulario, pero si llega sin `code`, `token_hash` o cookies de sesion, Supabase rechaza `updateUser({ password })` con error de sesion faltante.

Si se conserva el template default con `{{ .ConfirmationURL }}`, las invitaciones nuevas tambien pasan por `/auth/confirm` porque el `redirectTo` que envia la app ya apunta a esa ruta. Aun asi, el template con `token_hash` es el mas explicito y facil de auditar.
