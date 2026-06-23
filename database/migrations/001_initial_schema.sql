create extension if not exists pgcrypto;

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null,
  tipo text not null check (tipo in ('servicio', 'bien', 'organismo')),
  rubro text,
  descripcion text,
  logo text,
  color_marca text,
  sitio_externo text,
  visible_en_directorio boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint empresas_slug_unique unique (slug)
);

create table public.profiles (
  id uuid primary key references auth.users(id),
  nombre text not null,
  rol text not null check (rol in ('empresa', 'profesora_admin')),
  empresa_id uuid references public.empresas(id),
  created_at timestamptz not null default now(),
  constraint profiles_empresa_required_for_rol check (
    (rol = 'empresa' and empresa_id is not null)
    or rol = 'profesora_admin'
  )
);

create table public.correspondencia (
  id uuid primary key default gen_random_uuid(),
  remitente_empresa_id uuid not null references public.empresas(id),
  destinatario_empresa_id uuid not null references public.empresas(id),
  tipo text not null check (
    tipo in (
      'consulta',
      'pedido',
      'reclamo',
      'factura_simulada',
      'oficio',
      'notificacion'
    )
  ),
  asunto text not null,
  contenido text not null,
  estado text not null default 'enviado' check (
    estado in ('enviado', 'leido', 'respondido', 'archivado')
  ),
  reportado boolean not null default false,
  oculto boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.correspondencia_respuestas (
  id uuid primary key default gen_random_uuid(),
  correspondencia_id uuid not null references public.correspondencia(id),
  empresa_id uuid not null references public.empresas(id),
  contenido text not null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  accion text not null,
  objeto text,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index empresas_tipo_idx on public.empresas(tipo);
create index profiles_empresa_id_idx on public.profiles(empresa_id);
create index correspondencia_remitente_empresa_id_idx
  on public.correspondencia(remitente_empresa_id);
create index correspondencia_destinatario_empresa_id_idx
  on public.correspondencia(destinatario_empresa_id);
create index correspondencia_created_at_desc_idx
  on public.correspondencia(created_at desc);
create index correspondencia_estado_idx on public.correspondencia(estado);
create index correspondencia_respuestas_correspondencia_id_idx
  on public.correspondencia_respuestas(correspondencia_id);
create index audit_logs_created_at_desc_idx
  on public.audit_logs(created_at desc);
