insert into public.empresas (
  nombre,
  slug,
  tipo,
  rubro,
  descripcion,
  color_marca,
  sitio_externo,
  visible_en_directorio,
  activo
)
values
  (
    'Administracion ICM',
    'administracion-icm',
    'organismo',
    'Administracion educativa',
    'Organismo interno de supervision y administracion de la simulacion ICM Empresarial.',
    '#1f4f8f',
    null,
    false,
    true
  ),
  (
    'ICM Administracion',
    'icm-administracion',
    'organismo',
    'Coordinacion institucional',
    'Organismo interno para notificaciones generales, seguimiento y comunicaciones administrativas de la simulacion.',
    '#1f4f8f',
    null,
    true,
    true
  ),
  (
    'Agencia Tributaria Simulada',
    'agencia-tributaria-simulada',
    'organismo',
    'Tributario',
    'Organismo publico simulado para consultas, oficios y notificaciones tributarias dentro de la plataforma.',
    '#0f766e',
    null,
    true,
    true
  ),
  (
    'Municipalidad Simulada',
    'municipalidad-simulada',
    'organismo',
    'Habilitaciones',
    'Organismo publico simulado para tramites municipales, reclamos y comunicaciones institucionales.',
    '#7c3aed',
    null,
    true,
    true
  ),
  (
    'Banco ICM',
    'banco-icm',
    'servicio',
    'Servicios financieros',
    'Empresa simulada de servicios financieros para operaciones internas del entorno empresarial.',
    '#0369a1',
    null,
    true,
    true
  ),
  (
    'Logistica Andina',
    'logistica-andina',
    'servicio',
    'Logistica',
    'Empresa simulada para pedidos, coordinacion de entregas y reclamos vinculados a transporte.',
    '#15803d',
    null,
    true,
    true
  ),
  (
    'Fabrica del Sur',
    'fabrica-del-sur',
    'bien',
    'Produccion',
    'Empresa simulada de produccion de bienes para compras, ventas y documentacion comercial interna.',
    '#b45309',
    null,
    true,
    true
  )
on conflict (slug) do update
set
  nombre = excluded.nombre,
  tipo = excluded.tipo,
  rubro = excluded.rubro,
  descripcion = excluded.descripcion,
  color_marca = excluded.color_marca,
  sitio_externo = excluded.sitio_externo,
  visible_en_directorio = excluded.visible_en_directorio,
  activo = excluded.activo;
