alter table public.profiles
  add column if not exists estado text not null default 'pendiente',
  add column if not exists suspendido_motivo text,
  add column if not exists suspendido_at timestamptz,
  add column if not exists suspendido_por uuid references auth.users(id);

alter table public.profiles
  alter column estado set default 'pendiente';

alter table public.profiles
  drop constraint if exists profiles_estado_check;

alter table public.profiles
  add constraint profiles_estado_check
  check (estado in ('pendiente', 'activo', 'suspendido', 'dado_de_baja'));

alter table public.profiles
  drop constraint if exists profiles_empresa_required_for_rol;

alter table public.profiles
  add constraint profiles_empresa_required_for_rol check (
    (
      rol = 'empresa'
      and (
        empresa_id is not null
        or estado in ('pendiente', 'dado_de_baja')
      )
    )
    or rol = 'profesora_admin'
  );

create table if not exists public.solicitudes_registro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre_alumno text not null,
  email text not null,
  curso text,
  telefono text,
  nombre_entidad text not null,
  tipo_entidad text not null check (
    tipo_entidad in ('bien', 'servicio', 'organismo', 'banco')
  ),
  figura_legal text not null check (
    figura_legal in (
      'monotributo',
      'sas',
      'organismo_publico',
      'banco'
    )
  ),
  rubro text,
  descripcion text,
  socio_mayor text,
  responsable text,
  cargo_responsable text,
  cuit_simulado text,
  domicilio text,
  actividad_principal text,
  estado text not null default 'pendiente' check (
    estado in ('pendiente', 'aprobada', 'rechazada')
  ),
  revisado_por uuid references auth.users(id),
  revisado_at timestamptz,
  observaciones_admin text,
  created_at timestamptz not null default now()
);

alter table public.solicitudes_registro enable row level security;

create index if not exists solicitudes_registro_user_id_idx
  on public.solicitudes_registro(user_id);
create index if not exists solicitudes_registro_estado_idx
  on public.solicitudes_registro(estado);
create index if not exists solicitudes_registro_tipo_entidad_idx
  on public.solicitudes_registro(tipo_entidad);
create index if not exists profiles_estado_idx on public.profiles(estado);

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

drop policy if exists "usuarios ven solicitud propia" on public.solicitudes_registro;
create policy "usuarios ven solicitud propia"
on public.solicitudes_registro
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_profesora_admin()
);

drop policy if exists "usuarios crean solicitud propia" on public.solicitudes_registro;
create policy "usuarios crean solicitud propia"
on public.solicitudes_registro
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "solo admin actualiza solicitudes" on public.solicitudes_registro;
create policy "solo admin actualiza solicitudes"
on public.solicitudes_registro
for update
to authenticated
using (public.is_profesora_admin())
with check (public.is_profesora_admin());

drop policy if exists "usuarios crean perfil pendiente propio" on public.profiles;
create policy "usuarios crean perfil pendiente propio"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and rol = 'empresa'
  and empresa_id is null
  and estado = 'pendiente'
);

alter policy "empresas crean correspondencia propia"
on public.correspondencia
with check (
  public.is_profesora_admin()
  or (
    public.current_profile_estado() = 'activo'
    and remitente_empresa_id = public.current_empresa_id()
    and estado = 'enviado'
    and reportado = false
    and oculto = false
    and read_at is null
  )
);

alter policy "empresas responden conversaciones donde participan"
on public.correspondencia_respuestas
with check (
  public.is_profesora_admin()
  or (
    public.current_profile_estado() = 'activo'
    and empresa_id = public.current_empresa_id()
    and exists (
      select 1
      from public.correspondencia c
      where c.id = correspondencia_respuestas.correspondencia_id
        and c.oculto = false
        and (
          c.remitente_empresa_id = public.current_empresa_id()
          or c.destinatario_empresa_id = public.current_empresa_id()
        )
    )
  )
);

create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  nombre text,
  email text,
  rol text,
  empresa_id uuid,
  empresa_nombre text,
  estado text,
  suspendido_motivo text,
  suspendido_at timestamptz,
  suspendido_por uuid,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_profesora_admin() then
    raise exception 'Solo la profesora administradora puede listar usuarios.';
  end if;

  return query
    select
      p.id,
      p.nombre,
      u.email::text,
      p.rol,
      p.empresa_id,
      e.nombre as empresa_nombre,
      p.estado,
      p.suspendido_motivo,
      p.suspendido_at,
      p.suspendido_por,
      p.created_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    left join public.empresas e on e.id = p.empresa_id
    order by p.created_at desc;
end;
$$;

create or replace function public.handle_new_registration_request()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  metadata jsonb := new.raw_user_meta_data;
begin
  if metadata ? 'nombre_entidad' then
    insert into public.profiles (
      id,
      nombre,
      rol,
      empresa_id,
      estado
    )
    values (
      new.id,
      coalesce(nullif(metadata->>'nombre_alumno', ''), new.email),
      'empresa',
      null,
      'pendiente'
    )
    on conflict (id) do update
    set
      nombre = excluded.nombre,
      rol = excluded.rol,
      estado = 'pendiente';

    insert into public.solicitudes_registro (
      user_id,
      nombre_alumno,
      email,
      curso,
      telefono,
      nombre_entidad,
      tipo_entidad,
      figura_legal,
      rubro,
      descripcion,
      socio_mayor,
      responsable,
      cargo_responsable,
      cuit_simulado,
      domicilio,
      actividad_principal
    )
    values (
      new.id,
      coalesce(nullif(metadata->>'nombre_alumno', ''), new.email),
      new.email,
      nullif(metadata->>'curso', ''),
      nullif(metadata->>'telefono', ''),
      metadata->>'nombre_entidad',
      metadata->>'tipo_entidad',
      metadata->>'figura_legal',
      nullif(metadata->>'rubro', ''),
      nullif(metadata->>'descripcion', ''),
      nullif(metadata->>'socio_mayor', ''),
      nullif(metadata->>'responsable', ''),
      nullif(metadata->>'cargo_responsable', ''),
      nullif(metadata->>'cuit_simulado', ''),
      nullif(metadata->>'domicilio', ''),
      nullif(metadata->>'actividad_principal', '')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_registration on auth.users;

create trigger on_auth_user_created_registration
after insert on auth.users
for each row
execute function public.handle_new_registration_request();

revoke all on public.solicitudes_registro from anon, authenticated;
grant select, insert, update on public.solicitudes_registro to authenticated;

revoke execute on function public.current_profile_estado() from public;
revoke execute on function public.admin_list_profiles() from public;
revoke execute on function public.handle_new_registration_request() from public;

grant execute on function public.current_profile_estado() to authenticated;
grant execute on function public.admin_list_profiles() to authenticated;
