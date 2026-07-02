# Supabase Storage

Crear estos buckets en Supabase Storage:

```text
company-logos
company-banners
company-products
company-legal-documents
payment-receipts
mailbox-attachments
```

## Buckets de esta fase

Para logos y banners:

```text
company-logos
company-banners
```

Recomendación inicial:

- Buckets públicos para poder mostrar imágenes en cards y perfiles.
- Tamaño recomendado por archivo: imágenes hasta 10 MB.
- Formatos permitidos desde la app: PNG, JPG, JPEG y WebP.

Para documentos, comprobantes y adjuntos:

- PDF y Word: hasta 25 MB.
- Imágenes: hasta 10 MB.
- Videos MP4/MOV: hasta 100 MB.

## Uso previsto

- `company-logos`: logos de empresas, organismos y bancos.
- `company-banners`: banners de perfiles y sitio interno de empresa.
- `company-products`: imágenes de productos/servicios.
- `company-legal-documents`: documentación legal evaluable.
- `payment-receipts`: comprobantes de pago.
- `mailbox-attachments`: adjuntos del buzón/chat si se habilitan en la próxima etapa.

La app guarda la URL pública o path en `public.empresas.logo_url` y
`public.empresas.banner_url`.

## Recomendación para demo

Crear los buckets como públicos para que las vistas de empresa, documentación y
comprobantes puedan abrirse desde la app sin configuración adicional:

```sql
insert into storage.buckets (id, name, public)
values
  ('company-logos', 'company-logos', true),
  ('company-banners', 'company-banners', true),
  ('company-products', 'company-products', true),
  ('company-legal-documents', 'company-legal-documents', true),
  ('payment-receipts', 'payment-receipts', true),
  ('mailbox-attachments', 'mailbox-attachments', true)
on conflict (id) do update set public = excluded.public;
```

Políticas simples para la demo:

```sql
drop policy if exists "authenticated read storage demo" on storage.objects;
create policy "authenticated read storage demo"
on storage.objects for select
to authenticated
using (
  bucket_id in (
    'company-logos',
    'company-banners',
    'company-products',
    'company-legal-documents',
    'payment-receipts',
    'mailbox-attachments'
  )
);

drop policy if exists "authenticated upload storage demo" on storage.objects;
create policy "authenticated upload storage demo"
on storage.objects for insert
to authenticated
with check (
  bucket_id in (
    'company-logos',
    'company-banners',
    'company-products',
    'company-legal-documents',
    'payment-receipts',
    'mailbox-attachments'
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.estado = 'activo'
  )
);
```

Para producción conviene ajustar estas políticas por empresa/perfil. Para la
demo priorizamos que logos, banners, documentos y comprobantes se puedan cargar
y visualizar sin romper el flujo.
