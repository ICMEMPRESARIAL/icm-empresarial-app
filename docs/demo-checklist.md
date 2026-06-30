# Checklist de demo ICM Empresarial

## Variables Vercel

```text
NEXT_PUBLIC_SITE_URL=https://app.icmempresarial.com.ar
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

La app no usa `SUPABASE_SECRET_KEY` para operaciones normales.

## Flujo empresa

1. Entrar en `/login`.
2. Abrir `/dashboard`.
3. Revisar `/perfil-empresa` y cargar logo/banner.
4. Editar sitio interno en `/perfil-empresa/web`.
5. Crear producto o servicio en `/perfil-empresa/productos`.
6. Cargar documentación en `/perfil-empresa/documentacion`.
7. Ver `/empresas` y `/empresas/[slug]`.
8. Enviar mensaje desde `/buzon/nuevo`.
9. Iniciar trámite desde `/organismos/arca/tramites`.
10. Emitir factura desde `/facturas/nueva`.
11. Pagar factura recibida desde `/facturas/recibidas`.
12. Marcar factura/pago como registrado en Regisoft.

## Flujo profesora

1. Entrar en `/login`.
2. Abrir `/admin`.
3. Revisar solicitudes en `/admin/solicitudes`.
4. Aprobar o rechazar una solicitud.
5. Revisar usuarios en `/admin/usuarios`.
6. Revisar correspondencia en `/admin/correspondencia`.
7. Revisar trámites en `/admin/tramites`.
8. Revisar facturas y pagos en `/admin/facturas`.
9. Revisar auditoría en `/admin/auditoria`.

## Buckets necesarios

```text
company-logos
company-banners
company-products
company-legal-documents
payment-receipts
```

## Pendientes conocidos

- Los adjuntos de trámites funcionan como URL manual; no hay uploader dedicado.
- Los productos aceptan URL de imagen; el bucket `company-products` queda listo
  para una mejora posterior.
- Regisoft es manual: ICM marca estado y referencia, no se integra por API.
