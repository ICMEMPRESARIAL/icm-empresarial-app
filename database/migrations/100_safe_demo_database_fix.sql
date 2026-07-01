-- Safe demo database reconciliation for Supabase SQL Editor.
-- This migration is intentionally idempotent and does not delete existing data.

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.current_profile_estado()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select estado
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_profesora_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and rol = 'profesora_admin'
      and estado <> 'dado_de_baja'
  )
$$;

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

create table if not exists public.empresa_revision_contable (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  estudio_contable_empresa_id uuid references public.empresas(id),
  estado text not null default 'pendiente',
  observaciones_generales text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.empresa_revision_contable
  add column if not exists empresa_id uuid references public.empresas(id),
  add column if not exists estudio_contable_empresa_id uuid references public.empresas(id),
  add column if not exists estado text not null default 'pendiente',
  add column if not exists observaciones_generales text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.empresa_revision_contable_items (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.empresa_revision_contable(id),
  documento_legal_id uuid,
  estado text not null default 'pendiente',
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.empresa_revision_contable_items
  add column if not exists revision_id uuid references public.empresa_revision_contable(id),
  add column if not exists documento_legal_id uuid,
  add column if not exists estado text not null default 'pendiente',
  add column if not exists observacion text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if to_regclass('public.empresa_documentacion_legal') is not null then
    drop policy if exists "documentacion legal visible segun rol" on public.empresa_documentacion_legal;
    drop policy if exists "revision documentacion legal" on public.empresa_documentacion_legal;
  end if;

  if to_regclass('public.facturas') is not null then
    drop policy if exists "facturas_select_participantes_o_admin" on public.facturas;
  end if;

  if to_regclass('public.factura_items') is not null then
    drop policy if exists "factura_items_select_por_factura" on public.factura_items;
  end if;

  if to_regclass('public.pagos') is not null then
    drop policy if exists "pagos_select_participantes_o_admin" on public.pagos;
  end if;

  if to_regclass('public.factura_eventos') is not null then
    drop policy if exists "factura_eventos_select_por_factura" on public.factura_eventos;
  end if;
end;
$$;

drop function if exists public.es_estudio_contable_asignado(uuid);

create function public.es_estudio_contable_asignado(empresa_objetivo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empresa_revision_contable r
    where r.empresa_id = empresa_objetivo_id
      and r.estudio_contable_empresa_id = public.current_empresa_id()
  )
$$;

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

alter table public.empresa_web
  add column if not exists empresa_id uuid references public.empresas(id),
  add column if not exists slogan text,
  add column if not exists descripcion_inicio text,
  add column if not exists banner_url text,
  add column if not exists contacto_email text,
  add column if not exists contacto_telefono text,
  add column if not exists condiciones_contratacion text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.empresa_productos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  nombre text not null,
  tipo text not null,
  categoria text,
  descripcion text,
  precio_simulado numeric,
  modalidad text not null default 'mensual',
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.empresa_productos
  add column if not exists empresa_id uuid references public.empresas(id),
  add column if not exists nombre text,
  add column if not exists tipo text,
  add column if not exists categoria text,
  add column if not exists descripcion text,
  add column if not exists precio_simulado numeric,
  add column if not exists modalidad text not null default 'mensual',
  add column if not exists imagen_url text,
  add column if not exists activo boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

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
  estado text not null default 'pendiente',
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

alter table public.empresa_documentacion_legal
  add column if not exists empresa_id uuid references public.empresas(id),
  add column if not exists tipo_documento text,
  add column if not exists titulo text,
  add column if not exists descripcion text,
  add column if not exists categoria text,
  add column if not exists mes text,
  add column if not exists periodo_anio integer,
  add column if not exists tipo_movimiento text,
  add column if not exists origen text not null default 'manual',
  add column if not exists emitido_por text,
  add column if not exists visible_publicamente boolean not null default true,
  add column if not exists orden integer not null default 0,
  add column if not exists estado text not null default 'pendiente',
  add column if not exists archivo_path text,
  add column if not exists archivo_nombre text,
  add column if not exists archivo_tipo text,
  add column if not exists archivo_size bigint,
  add column if not exists observacion text,
  add column if not exists revisado_por uuid references auth.users(id),
  add column if not exists revisado_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresa_revision_contable_items_documento_fk'
      and conrelid = 'public.empresa_revision_contable_items'::regclass
  ) then
    alter table public.empresa_revision_contable_items
      add constraint empresa_revision_contable_items_documento_fk
      foreign key (documento_legal_id)
      references public.empresa_documentacion_legal(id)
      not valid;
  end if;
end;
$$;

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

alter table public.facturas
  add column if not exists numero_factura text,
  add column if not exists emisor_empresa_id uuid references public.empresas(id),
  add column if not exists receptor_empresa_id uuid references public.empresas(id),
  add column if not exists fecha_emision date not null default current_date,
  add column if not exists fecha_vencimiento date,
  add column if not exists tipo_factura text not null default 'simulada',
  add column if not exists estado text not null default 'emitida',
  add column if not exists concepto text,
  add column if not exists subtotal numeric not null default 0,
  add column if not exists iva numeric not null default 0,
  add column if not exists total numeric not null default 0,
  add column if not exists observaciones text,
  add column if not exists registrado_en_regisoft boolean not null default false,
  add column if not exists registrado_en_regisoft_at timestamptz,
  add column if not exists registrado_en_regisoft_por uuid references auth.users(id),
  add column if not exists referencia_regisoft text,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.factura_items (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id) on delete cascade,
  descripcion text not null,
  cantidad numeric not null default 1,
  precio_unitario numeric not null default 0,
  subtotal numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.factura_items
  add column if not exists factura_id uuid references public.facturas(id),
  add column if not exists descripcion text,
  add column if not exists cantidad numeric not null default 1,
  add column if not exists precio_unitario numeric not null default 0,
  add column if not exists subtotal numeric not null default 0,
  add column if not exists created_at timestamptz not null default now();

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

alter table public.pagos
  add column if not exists factura_id uuid references public.facturas(id),
  add column if not exists pagador_empresa_id uuid references public.empresas(id),
  add column if not exists cobrador_empresa_id uuid references public.empresas(id),
  add column if not exists importe numeric not null default 0,
  add column if not exists fecha_pago date not null default current_date,
  add column if not exists medio_pago text,
  add column if not exists numero_operacion text,
  add column if not exists estado text not null default 'enviado',
  add column if not exists comprobante_path text,
  add column if not exists observaciones text,
  add column if not exists registrado_en_regisoft boolean not null default false,
  add column if not exists registrado_en_regisoft_at timestamptz,
  add column if not exists registrado_en_regisoft_por uuid references auth.users(id),
  add column if not exists referencia_regisoft text,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

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

alter table public.factura_eventos
  add column if not exists factura_id uuid references public.facturas(id),
  add column if not exists actor_id uuid references auth.users(id),
  add column if not exists actor_empresa_id uuid references public.empresas(id),
  add column if not exists estado_anterior text,
  add column if not exists estado_nuevo text,
  add column if not exists titulo text,
  add column if not exists descripcion text,
  add column if not exists created_at timestamptz not null default now();

alter table public.empresa_revision_contable enable row level security;
alter table public.empresa_revision_contable_items enable row level security;
alter table public.empresa_web enable row level security;
alter table public.empresa_productos enable row level security;
alter table public.empresa_documentacion_legal enable row level security;
alter table public.facturas enable row level security;
alter table public.factura_items enable row level security;
alter table public.pagos enable row level security;
alter table public.factura_eventos enable row level security;

create index if not exists empresa_revision_contable_empresa_id_idx
  on public.empresa_revision_contable(empresa_id);
create index if not exists empresa_revision_contable_estudio_idx
  on public.empresa_revision_contable(estudio_contable_empresa_id);
create index if not exists empresa_revision_contable_items_revision_idx
  on public.empresa_revision_contable_items(revision_id);
create index if not exists empresa_web_empresa_id_idx
  on public.empresa_web(empresa_id);
create index if not exists empresa_productos_empresa_id_idx
  on public.empresa_productos(empresa_id);
create index if not exists empresa_productos_activo_idx
  on public.empresa_productos(activo);
create index if not exists empresa_documentacion_legal_empresa_id_idx
  on public.empresa_documentacion_legal(empresa_id);
create index if not exists empresa_documentacion_legal_estado_idx
  on public.empresa_documentacion_legal(estado);
create index if not exists facturas_emisor_idx
  on public.facturas(emisor_empresa_id);
create index if not exists facturas_receptor_idx
  on public.facturas(receptor_empresa_id);
create index if not exists facturas_estado_idx
  on public.facturas(estado);
create index if not exists facturas_created_at_idx
  on public.facturas(created_at desc);
create index if not exists facturas_regisoft_idx
  on public.facturas(registrado_en_regisoft);
create index if not exists factura_items_factura_idx
  on public.factura_items(factura_id);
create index if not exists pagos_factura_idx
  on public.pagos(factura_id);
create index if not exists pagos_pagador_idx
  on public.pagos(pagador_empresa_id);
create index if not exists pagos_cobrador_idx
  on public.pagos(cobrador_empresa_id);
create index if not exists pagos_estado_idx
  on public.pagos(estado);
create index if not exists pagos_regisoft_idx
  on public.pagos(registrado_en_regisoft);
create index if not exists factura_eventos_factura_idx
  on public.factura_eventos(factura_id);

drop policy if exists "web visible para autenticados" on public.empresa_web;
create policy "web visible para autenticados"
on public.empresa_web
for select
to authenticated
using (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.empresas e
    where e.id = empresa_web.empresa_id
      and e.activo = true
      and e.visible_en_directorio = true
  )
);

drop policy if exists "empresa inserta web propia" on public.empresa_web;
create policy "empresa inserta web propia"
on public.empresa_web
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or (
    empresa_id = public.current_empresa_id()
    and public.current_profile_estado() = 'activo'
  )
);

drop policy if exists "empresa actualiza web propia" on public.empresa_web;
create policy "empresa actualiza web propia"
on public.empresa_web
for update
to authenticated
using (
  public.is_profesora_admin()
  or (
    empresa_id = public.current_empresa_id()
    and public.current_profile_estado() = 'activo'
  )
)
with check (
  public.is_profesora_admin()
  or (
    empresa_id = public.current_empresa_id()
    and public.current_profile_estado() = 'activo'
  )
);

drop policy if exists "empresa edita web propia" on public.empresa_web;

drop policy if exists "productos activos visibles" on public.empresa_productos;
create policy "productos activos visibles"
on public.empresa_productos
for select
to authenticated
using (
  public.is_profesora_admin()
  or empresa_id = public.current_empresa_id()
  or (
    activo = true
    and exists (
      select 1
      from public.empresas e
      where e.id = empresa_productos.empresa_id
        and e.activo = true
        and e.visible_en_directorio = true
    )
  )
);

drop policy if exists "empresa inserta productos propios" on public.empresa_productos;
create policy "empresa inserta productos propios"
on public.empresa_productos
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or (
    empresa_id = public.current_empresa_id()
    and public.current_profile_estado() = 'activo'
  )
);

drop policy if exists "empresa actualiza productos propios" on public.empresa_productos;
create policy "empresa actualiza productos propios"
on public.empresa_productos
for update
to authenticated
using (
  public.is_profesora_admin()
  or (
    empresa_id = public.current_empresa_id()
    and public.current_profile_estado() = 'activo'
  )
)
with check (
  public.is_profesora_admin()
  or (
    empresa_id = public.current_empresa_id()
    and public.current_profile_estado() = 'activo'
  )
);

drop policy if exists "empresa gestiona productos propios" on public.empresa_productos;

drop policy if exists "documentacion legal visible segun rol" on public.empresa_documentacion_legal;
create policy "documentacion legal visible segun rol"
on public.empresa_documentacion_legal
for select
to authenticated
using (
  public.is_profesora_admin()
  or empresa_id = public.current_empresa_id()
  or public.es_estudio_contable_asignado(empresa_id)
  or visible_publicamente = true
);

drop policy if exists "empresa carga documentacion propia" on public.empresa_documentacion_legal;
create policy "empresa carga documentacion propia"
on public.empresa_documentacion_legal
for insert
to authenticated
with check (
  public.current_profile_estado() = 'activo'
  and (
    public.is_profesora_admin()
    or (
      empresa_id = public.current_empresa_id()
      and created_by = auth.uid()
    )
  )
);

drop policy if exists "revision documentacion legal" on public.empresa_documentacion_legal;
create policy "revision documentacion legal"
on public.empresa_documentacion_legal
for update
to authenticated
using (
  public.is_profesora_admin()
  or empresa_id = public.current_empresa_id()
  or public.es_estudio_contable_asignado(empresa_id)
)
with check (
  public.is_profesora_admin()
  or empresa_id = public.current_empresa_id()
  or public.es_estudio_contable_asignado(empresa_id)
);

drop policy if exists "revision contable visible" on public.empresa_revision_contable;
create policy "revision contable visible"
on public.empresa_revision_contable
for select
to authenticated
using (
  public.is_profesora_admin()
  or empresa_id = public.current_empresa_id()
  or estudio_contable_empresa_id = public.current_empresa_id()
);

drop policy if exists "admin inserta revision contable" on public.empresa_revision_contable;
create policy "admin inserta revision contable"
on public.empresa_revision_contable
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or estudio_contable_empresa_id = public.current_empresa_id()
);

drop policy if exists "admin actualiza revision contable" on public.empresa_revision_contable;
create policy "admin actualiza revision contable"
on public.empresa_revision_contable
for update
to authenticated
using (
  public.is_profesora_admin()
  or estudio_contable_empresa_id = public.current_empresa_id()
)
with check (
  public.is_profesora_admin()
  or estudio_contable_empresa_id = public.current_empresa_id()
);

drop policy if exists "admin gestiona revision contable" on public.empresa_revision_contable;

drop policy if exists "items revision contable visibles" on public.empresa_revision_contable_items;
create policy "items revision contable visibles"
on public.empresa_revision_contable_items
for select
to authenticated
using (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.empresa_revision_contable r
    where r.id = empresa_revision_contable_items.revision_id
      and (
        r.empresa_id = public.current_empresa_id()
        or r.estudio_contable_empresa_id = public.current_empresa_id()
      )
  )
);

drop policy if exists "estudio inserta items revision contable" on public.empresa_revision_contable_items;
create policy "estudio inserta items revision contable"
on public.empresa_revision_contable_items
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.empresa_revision_contable r
    where r.id = empresa_revision_contable_items.revision_id
      and r.estudio_contable_empresa_id = public.current_empresa_id()
  )
);

drop policy if exists "estudio actualiza items revision contable" on public.empresa_revision_contable_items;
create policy "estudio actualiza items revision contable"
on public.empresa_revision_contable_items
for update
to authenticated
using (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.empresa_revision_contable r
    where r.id = empresa_revision_contable_items.revision_id
      and r.estudio_contable_empresa_id = public.current_empresa_id()
  )
)
with check (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.empresa_revision_contable r
    where r.id = empresa_revision_contable_items.revision_id
      and r.estudio_contable_empresa_id = public.current_empresa_id()
  )
);

drop policy if exists "estudio gestiona items revision contable" on public.empresa_revision_contable_items;

drop policy if exists "facturas_select_participantes_o_admin" on public.facturas;
create policy "facturas_select_participantes_o_admin"
on public.facturas
for select
to authenticated
using (
  public.is_profesora_admin()
  or emisor_empresa_id = public.current_empresa_id()
  or receptor_empresa_id = public.current_empresa_id()
  or public.es_estudio_contable_asignado(emisor_empresa_id)
  or public.es_estudio_contable_asignado(receptor_empresa_id)
);

drop policy if exists "facturas_insert_emisor_o_admin" on public.facturas;
create policy "facturas_insert_emisor_o_admin"
on public.facturas
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or (
    public.current_profile_estado() = 'activo'
    and emisor_empresa_id = public.current_empresa_id()
  )
);

drop policy if exists "facturas_update_participantes_o_admin" on public.facturas;
create policy "facturas_update_participantes_o_admin"
on public.facturas
for update
to authenticated
using (
  public.is_profesora_admin()
  or emisor_empresa_id = public.current_empresa_id()
  or receptor_empresa_id = public.current_empresa_id()
)
with check (
  public.is_profesora_admin()
  or emisor_empresa_id = public.current_empresa_id()
  or receptor_empresa_id = public.current_empresa_id()
);

drop policy if exists "factura_items_select_por_factura" on public.factura_items;
create policy "factura_items_select_por_factura"
on public.factura_items
for select
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

drop policy if exists "factura_items_insert_emisor_o_admin" on public.factura_items;
create policy "factura_items_insert_emisor_o_admin"
on public.factura_items
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.facturas f
    where f.id = factura_items.factura_id
      and f.emisor_empresa_id = public.current_empresa_id()
  )
);

drop policy if exists "pagos_select_participantes_o_admin" on public.pagos;
create policy "pagos_select_participantes_o_admin"
on public.pagos
for select
to authenticated
using (
  public.is_profesora_admin()
  or pagador_empresa_id = public.current_empresa_id()
  or cobrador_empresa_id = public.current_empresa_id()
  or public.es_estudio_contable_asignado(pagador_empresa_id)
  or public.es_estudio_contable_asignado(cobrador_empresa_id)
);

drop policy if exists "pagos_insert_pagador_o_admin" on public.pagos;
create policy "pagos_insert_pagador_o_admin"
on public.pagos
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or (
    public.current_profile_estado() = 'activo'
    and pagador_empresa_id = public.current_empresa_id()
  )
);

drop policy if exists "pagos_update_participantes_o_admin" on public.pagos;
create policy "pagos_update_participantes_o_admin"
on public.pagos
for update
to authenticated
using (
  public.is_profesora_admin()
  or pagador_empresa_id = public.current_empresa_id()
  or cobrador_empresa_id = public.current_empresa_id()
)
with check (
  public.is_profesora_admin()
  or pagador_empresa_id = public.current_empresa_id()
  or cobrador_empresa_id = public.current_empresa_id()
);

drop policy if exists "factura_eventos_select_por_factura" on public.factura_eventos;
create policy "factura_eventos_select_por_factura"
on public.factura_eventos
for select
to authenticated
using (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.facturas f
    where f.id = factura_eventos.factura_id
      and (
        f.emisor_empresa_id = public.current_empresa_id()
        or f.receptor_empresa_id = public.current_empresa_id()
        or public.es_estudio_contable_asignado(f.emisor_empresa_id)
        or public.es_estudio_contable_asignado(f.receptor_empresa_id)
      )
  )
);

drop policy if exists "factura_eventos_insert_participantes_o_admin" on public.factura_eventos;
create policy "factura_eventos_insert_participantes_o_admin"
on public.factura_eventos
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.facturas f
    where f.id = factura_eventos.factura_id
      and (
        f.emisor_empresa_id = public.current_empresa_id()
        or f.receptor_empresa_id = public.current_empresa_id()
      )
  )
);

revoke all on public.empresa_web from anon, authenticated;
revoke all on public.empresa_productos from anon, authenticated;
revoke all on public.empresa_documentacion_legal from anon, authenticated;
revoke all on public.empresa_revision_contable from anon, authenticated;
revoke all on public.empresa_revision_contable_items from anon, authenticated;
revoke all on public.facturas from anon, authenticated;
revoke all on public.factura_items from anon, authenticated;
revoke all on public.pagos from anon, authenticated;
revoke all on public.factura_eventos from anon, authenticated;

grant select, insert, update on public.empresa_web to authenticated;
grant select, insert, update on public.empresa_productos to authenticated;
grant select, insert, update on public.empresa_documentacion_legal to authenticated;
grant select, insert, update on public.empresa_revision_contable to authenticated;
grant select, insert, update on public.empresa_revision_contable_items to authenticated;
grant select, insert, update on public.facturas to authenticated;
grant select, insert on public.factura_items to authenticated;
grant select, insert, update on public.pagos to authenticated;
grant select, insert on public.factura_eventos to authenticated;

revoke delete on public.empresa_web from authenticated;
revoke delete on public.empresa_productos from authenticated;
revoke delete on public.empresa_documentacion_legal from authenticated;
revoke delete on public.empresa_revision_contable from authenticated;
revoke delete on public.empresa_revision_contable_items from authenticated;
revoke delete on public.facturas from authenticated;
revoke delete on public.factura_items from authenticated;
revoke delete on public.pagos from authenticated;
revoke delete on public.factura_eventos from authenticated;

revoke execute on function public.current_empresa_id() from public;
revoke execute on function public.current_profile_estado() from public;
revoke execute on function public.is_profesora_admin() from public;
revoke execute on function public.es_estudio_contable_asignado(uuid) from public;

grant execute on function public.current_empresa_id() to authenticated;
grant execute on function public.current_profile_estado() to authenticated;
grant execute on function public.is_profesora_admin() to authenticated;
grant execute on function public.es_estudio_contable_asignado(uuid) to authenticated;

notify pgrst, 'reload schema';
