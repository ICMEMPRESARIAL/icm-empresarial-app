# Activacion masiva de emergencia

Este flujo reemplaza temporalmente `inviteUserByEmail` para evitar links rotos por perdida de sesion en el callback SSR.

## Que cambia

- La profesora envia enlaces propios de ICM con formato `/activar?token=...`.
- El token se guarda solamente como SHA-256 en `public.user_activation_invites`.
- La tabla no tiene policies RLS para usuarios normales; solo el backend con `SUPABASE_SECRET_KEY` la opera.
- Al activar, el backend crea o actualiza el usuario con Supabase Admin API, confirma el email, upsertea `profiles`, marca el token usado e inicia sesion con `signInWithPassword`.
- Las empresas van a `/onboarding`; las profesoras van a `/admin`.

## SQL requerido

Aplicar en Supabase:

```text
database/migrations/016_emergency_activation_invites.sql
```

## Variables requeridas en Vercel

```text
NEXT_PUBLIC_APP_URL=https://app.icmempresarial.com.ar
NEXT_PUBLIC_SITE_URL=https://app.icmempresarial.com.ar
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=ICM Empresarial
```

Opcional:

```text
BREVO_REPLY_TO_EMAIL=...
BREVO_REPLY_TO_NAME=ICM Empresarial
```

## Lanzamiento seguro del lote

1. Aplicar la migracion `016_emergency_activation_invites.sql`.
2. Cargar las variables Brevo en Vercel Preview y Production.
3. Abrir el PR y esperar Preview verde.
4. En Preview, entrar como profesora a `/admin/invitaciones`.
5. Elegir una empresa demo con email propio, enviar invitacion individual y abrir el email.
6. Confirmar que `/activar` muestra empresa/email correctos.
7. Crear contraseña, verificar redireccion a `/onboarding` y completar la primera pantalla si corresponde.
8. Confirmar que el token queda con `used_at` y que un segundo uso muestra enlace no disponible.
9. Recién despues de la prueba demo, mergear y esperar Production Ready.
10. En Production, entrar a `/admin/invitaciones`, revisar la vista previa y marcar las dos confirmaciones: Preview verde y demo exitosa.
11. Ejecutar `Enviar lote`.
12. Revisar resultados por empresa en pantalla. Las filas `omitido` no duplican envios recientes; las `fallido` muestran el detalle de Brevo.

## Notas operativas

- El lote tiene rate limiting practico: no reenvia si ya hubo un envio activo para la misma empresa/email en las ultimas 6 horas.
- Si se necesita reenviar antes, revocar manualmente el registro activo en `user_activation_invites` y volver a enviar.
- No reutilizar emails viejos de Supabase Auth. El unico link valido para este flujo es `/activar?token=...`.
