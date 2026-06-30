# Supabase Storage

Crear estos buckets en Supabase Storage:

```text
company-logos
company-banners
company-products
company-legal-documents
payment-receipts
```

## Buckets de esta fase

Para logos y banners:

```text
company-logos
company-banners
```

Recomendación inicial:

- Buckets públicos para poder mostrar imágenes en cards y perfiles.
- Tamaño razonable por archivo: hasta 2 MB.
- Formatos permitidos desde la app: PNG, JPG, JPEG y WebP.

## Uso previsto

- `company-logos`: logos de empresas, organismos y bancos.
- `company-banners`: banners de perfiles y sitio interno de empresa.
- `company-products`: imágenes de productos/servicios.
- `company-legal-documents`: documentación legal evaluable.
- `payment-receipts`: comprobantes de pago.

La app guarda la URL pública o path en `public.empresas.logo_url` y
`public.empresas.banner_url`.
