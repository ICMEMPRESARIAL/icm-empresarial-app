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

create table if not exists public.empresa_revision_contable (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  estudio_contable_empresa_id uuid references public.empresas(id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_revision', 'observado', 'aprobado')),
  observaciones_generales text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.empresa_revision_contable_items (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.empresa_revision_contable(id),
  documento_legal_id uuid references public.empresa_documentacion_legal(id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'observado', 'aprobado', 'rechazado')),
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.empresa_web enable row level security;
alter table public.empresa_productos enable row level security;
alter table public.empresa_documentacion_legal enable row level security;
alter table public.empresa_revision_contable enable row level security;
alter table public.empresa_revision_contable_items enable row level security;

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
create index if not exists empresa_revision_contable_empresa_id_idx
  on public.empresa_revision_contable(empresa_id);
create index if not exists empresa_revision_contable_estudio_idx
  on public.empresa_revision_contable(estudio_contable_empresa_id);
create index if not exists empresa_revision_contable_items_revision_idx
  on public.empresa_revision_contable_items(revision_id);

create or replace function public.es_estudio_contable_asignado(target_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empresa_revision_contable r
    where r.empresa_id = target_empresa_id
      and r.estudio_contable_empresa_id = public.current_empresa_id()
  )
$$;

drop policy if exists "web visible para autenticados" on public.empresa_web;
create policy "web visible para autenticados"
on public.empresa_web
for select
to authenticated
using (
  public.is_profesora_admin()
  or exists (
    select 1 from public.empresas e
    where e.id = empresa_id
      and e.activo = true
      and e.visible_en_directorio = true
  )
);

drop policy if exists "empresa edita web propia" on public.empresa_web;
create policy "empresa edita web propia"
on public.empresa_web
for all
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
      select 1 from public.empresas e
      where e.id = empresa_id
        and e.activo = true
        and e.visible_en_directorio = true
    )
  )
);

drop policy if exists "empresa gestiona productos propios" on public.empresa_productos;
create policy "empresa gestiona productos propios"
on public.empresa_productos
for all
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

drop policy if exists "admin gestiona revision contable" on public.empresa_revision_contable;
create policy "admin gestiona revision contable"
on public.empresa_revision_contable
for all
to authenticated
using (
  public.is_profesora_admin()
  or estudio_contable_empresa_id = public.current_empresa_id()
)
with check (
  public.is_profesora_admin()
  or estudio_contable_empresa_id = public.current_empresa_id()
);

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
    where r.id = revision_id
      and (
        r.empresa_id = public.current_empresa_id()
        or r.estudio_contable_empresa_id = public.current_empresa_id()
      )
  )
);

drop policy if exists "estudio gestiona items revision contable" on public.empresa_revision_contable_items;
create policy "estudio gestiona items revision contable"
on public.empresa_revision_contable_items
for all
to authenticated
using (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.empresa_revision_contable r
    where r.id = revision_id
      and r.estudio_contable_empresa_id = public.current_empresa_id()
  )
)
with check (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.empresa_revision_contable r
    where r.id = revision_id
      and r.estudio_contable_empresa_id = public.current_empresa_id()
  )
);

revoke all on public.empresa_web from anon, authenticated;
revoke all on public.empresa_productos from anon, authenticated;
revoke all on public.empresa_documentacion_legal from anon, authenticated;
revoke all on public.empresa_revision_contable from anon, authenticated;
revoke all on public.empresa_revision_contable_items from anon, authenticated;

grant select, insert, update on public.empresa_web to authenticated;
grant select, insert, update on public.empresa_productos to authenticated;
grant select, insert, update on public.empresa_documentacion_legal to authenticated;
grant select, insert, update on public.empresa_revision_contable to authenticated;
grant select, insert, update on public.empresa_revision_contable_items to authenticated;

revoke execute on function public.es_estudio_contable_asignado(uuid) from public;
grant execute on function public.es_estudio_contable_asignado(uuid) to authenticated;
