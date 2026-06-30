-- Reconciliacion defensiva previa a demo.
-- Mantiene datos existentes y acota permisos operativos sin agregar flujos nuevos.

alter table public.profiles
  add column if not exists estado text not null default 'pendiente',
  add column if not exists suspendido_motivo text,
  add column if not exists suspendido_at timestamptz,
  add column if not exists suspendido_por uuid references auth.users(id);

alter table public.empresas
  add column if not exists logo_url text,
  add column if not exists banner_url text,
  add column if not exists color_marca text,
  add column if not exists figura_legal text,
  add column if not exists razon_social text,
  add column if not exists nombre_comercial text,
  add column if not exists slogan text,
  add column if not exists cuit_simulado text,
  add column if not exists domicilio text,
  add column if not exists actividad_principal text,
  add column if not exists curso_anio text,
  add column if not exists curso_division text,
  add column if not exists integrantes jsonb not null default '[]'::jsonb,
  add column if not exists responsable text,
  add column if not exists persona_juridica text,
  add column if not exists socio_responsable text,
  add column if not exists contacto_email text,
  add column if not exists contacto_telefono text,
  add column if not exists sitio_web text,
  add column if not exists instagram text,
  add column if not exists publicado boolean not null default true;

alter table public.solicitudes_registro
  add column if not exists curso_anio text,
  add column if not exists curso_division text,
  add column if not exists integrantes jsonb not null default '[]'::jsonb,
  add column if not exists socio_responsable text,
  add column if not exists persona_juridica text;

alter table public.tipos_tramite
  add column if not exists categoria text,
  add column if not exists documentacion_esperada text;

alter table public.tramites
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists titulo text,
  add column if not exists datos_formulario jsonb not null default '{}'::jsonb,
  add column if not exists prioridad text not null default 'normal';

create table if not exists public.empresa_web (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid unique not null references public.empresas(id),
  slogan text,
  descripcion_inicio text,
  banner_url text,
  contacto_email text,
  contacto_telefono text,
  condiciones_contratacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.empresa_productos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  nombre text not null,
  tipo text not null check (tipo in ('producto', 'servicio')),
  categoria text,
  descripcion text,
  precio_simulado numeric,
  modalidad text not null default 'mensual'
    check (modalidad in ('unica', 'mensual', 'bimestral', 'trimestral')),
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.empresa_documentacion_legal (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  tipo_documento text not null,
  titulo text not null,
  descripcion text,
  categoria text,
  mes text,
  periodo_anio integer,
  tipo_movimiento text,
  origen text not null default 'manual',
  emitido_por text,
  visible_publicamente boolean not null default true,
  orden integer not null default 0,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'presentado', 'observado', 'aprobado', 'rechazado')),
  archivo_path text,
  archivo_nombre text,
  archivo_tipo text,
  archivo_size bigint,
  observacion text,
  revisado_por uuid references auth.users(id),
  revisado_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  numero_factura text unique not null,
  emisor_empresa_id uuid not null references public.empresas(id),
  receptor_empresa_id uuid not null references public.empresas(id),
  fecha_emision date not null default current_date,
  fecha_vencimiento date,
  tipo_factura text not null default 'simulada',
  estado text not null default 'emitida',
  concepto text,
  subtotal numeric not null default 0,
  iva numeric not null default 0,
  total numeric not null default 0,
  observaciones text,
  registrado_en_regisoft boolean not null default false,
  registrado_en_regisoft_at timestamptz,
  registrado_en_regisoft_por uuid references auth.users(id),
  referencia_regisoft text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.factura_items (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id) on delete cascade,
  descripcion text not null,
  cantidad numeric not null default 1,
  precio_unitario numeric not null default 0,
  subtotal numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id),
  pagador_empresa_id uuid not null references public.empresas(id),
  cobrador_empresa_id uuid not null references public.empresas(id),
  importe numeric not null,
  fecha_pago date not null default current_date,
  medio_pago text not null,
  numero_operacion text,
  estado text not null default 'enviado',
  comprobante_path text,
  observaciones text,
  registrado_en_regisoft boolean not null default false,
  registrado_en_regisoft_at timestamptz,
  registrado_en_regisoft_por uuid references auth.users(id),
  referencia_regisoft text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.factura_eventos (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id) on delete cascade,
  actor_id uuid references auth.users(id),
  actor_empresa_id uuid references public.empresas(id),
  estado_anterior text,
  estado_nuevo text,
  titulo text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

alter table public.empresa_web enable row level security;
alter table public.empresa_productos enable row level security;
alter table public.empresa_documentacion_legal enable row level security;
alter table public.facturas enable row level security;
alter table public.factura_items enable row level security;
alter table public.pagos enable row level security;
alter table public.factura_eventos enable row level security;

drop policy if exists "factura_items_select_por_factura" on public.factura_items;
create policy "factura_items_select_por_factura"
on public.factura_items for select
to authenticated
using (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.facturas f
    where f.id = factura_items.factura_id
      and (
        f.emisor_empresa_id = public.current_empresa_id()
        or f.receptor_empresa_id = public.current_empresa_id()
        or public.es_estudio_contable_asignado(f.emisor_empresa_id)
        or public.es_estudio_contable_asignado(f.receptor_empresa_id)
      )
  )
);

revoke update on public.facturas from authenticated;
grant update (
  estado,
  observaciones,
  registrado_en_regisoft,
  registrado_en_regisoft_at,
  registrado_en_regisoft_por,
  referencia_regisoft,
  updated_at
) on public.facturas to authenticated;

revoke update on public.pagos from authenticated;
grant update (
  estado,
  observaciones,
  registrado_en_regisoft,
  registrado_en_regisoft_at,
  registrado_en_regisoft_por,
  referencia_regisoft,
  updated_at
) on public.pagos to authenticated;

revoke delete on public.empresas from authenticated;
revoke delete on public.profiles from authenticated;
revoke delete on public.solicitudes_registro from authenticated;
revoke delete on public.correspondencia from authenticated;
revoke delete on public.correspondencia_respuestas from authenticated;
revoke delete on public.tipos_tramite from authenticated;
revoke delete on public.tramites from authenticated;
revoke delete on public.tramite_eventos from authenticated;
revoke delete on public.tramite_comentarios from authenticated;
revoke delete on public.tramite_adjuntos from authenticated;
revoke delete on public.empresa_web from authenticated;
revoke delete on public.empresa_productos from authenticated;
revoke delete on public.empresa_documentacion_legal from authenticated;
revoke delete on public.empresa_revision_contable from authenticated;
revoke delete on public.empresa_revision_contable_items from authenticated;
revoke delete on public.facturas from authenticated;
revoke delete on public.factura_items from authenticated;
revoke delete on public.pagos from authenticated;
revoke delete on public.factura_eventos from authenticated;
