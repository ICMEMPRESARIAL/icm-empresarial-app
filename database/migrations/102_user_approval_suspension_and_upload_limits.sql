alter table public.profiles
  add column if not exists suspendido_hasta timestamptz,
  add column if not exists conducta_estado text not null default 'excelente',
  add column if not exists conducta_observacion text,
  add column if not exists cantidad_suspensiones integer not null default 0,
  add column if not exists ultima_suspension_at timestamptz;

alter table public.solicitudes_registro
  add column if not exists curso_anio text,
  add column if not exists curso_division text,
  add column if not exists integrantes jsonb not null default '[]'::jsonb,
  add column if not exists socio_responsable text,
  add column if not exists persona_juridica text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_estado_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_estado_check;
  end if;

  alter table public.profiles
    add constraint profiles_estado_check
    check (estado in ('pendiente', 'activo', 'suspendido', 'dado_de_baja'));

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_conducta_estado_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_conducta_estado_check
      check (
        conducta_estado in (
          'excelente',
          'observado',
          'suspendido_previamente',
          'reincidente',
          'grave'
        )
      );
  end if;
end;
$$;

create table if not exists public.user_suspensiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid references public.empresas(id),
  motivo text not null,
  detalle text,
  estado text not null default 'activa'
    check (estado in ('activa', 'cumplida', 'levantada', 'cancelada')),
  suspendido_desde timestamptz not null default now(),
  suspendido_hasta timestamptz,
  suspendido_por uuid references auth.users(id),
  levantada_por uuid references auth.users(id),
  levantada_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_suspensiones enable row level security;

create index if not exists user_suspensiones_user_id_idx
  on public.user_suspensiones(user_id);
create index if not exists user_suspensiones_empresa_id_idx
  on public.user_suspensiones(empresa_id);
create index if not exists user_suspensiones_estado_idx
  on public.user_suspensiones(estado);
create index if not exists user_suspensiones_suspendido_hasta_idx
  on public.user_suspensiones(suspendido_hasta);
create index if not exists profiles_conducta_estado_idx
  on public.profiles(conducta_estado);
create index if not exists profiles_suspendido_hasta_idx
  on public.profiles(suspendido_hasta);

drop policy if exists "usuarios ven historial propio" on public.user_suspensiones;
create policy "usuarios ven historial propio"
on public.user_suspensiones
for select
to authenticated
using (
  public.is_profesora_admin()
  or user_id = auth.uid()
  or empresa_id = public.current_empresa_id()
);

drop policy if exists "solo admin crea suspensiones" on public.user_suspensiones;
create policy "solo admin crea suspensiones"
on public.user_suspensiones
for insert
to authenticated
with check (public.is_profesora_admin());

drop policy if exists "solo admin actualiza suspensiones" on public.user_suspensiones;
create policy "solo admin actualiza suspensiones"
on public.user_suspensiones
for update
to authenticated
using (public.is_profesora_admin())
with check (public.is_profesora_admin());

drop function if exists public.admin_list_profiles();

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
  suspendido_hasta timestamptz,
  suspendido_por uuid,
  conducta_estado text,
  conducta_observacion text,
  cantidad_suspensiones integer,
  ultima_suspension_at timestamptz,
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
      p.suspendido_hasta,
      p.suspendido_por,
      p.conducta_estado,
      p.conducta_observacion,
      p.cantidad_suspensiones,
      p.ultima_suspension_at,
      p.created_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    left join public.empresas e on e.id = p.empresa_id
    order by p.created_at desc;
end;
$$;

grant select, insert, update on public.user_suspensiones to authenticated;
revoke delete on public.user_suspensiones from authenticated;

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

    if exists (
      select 1
      from public.solicitudes_registro
      where user_id = new.id
        and estado = 'pendiente'
    ) then
      update public.solicitudes_registro
      set
        nombre_alumno = coalesce(nullif(metadata->>'nombre_alumno', ''), new.email),
        email = new.email,
        curso = nullif(metadata->>'curso', ''),
        curso_anio = nullif(metadata->>'curso_anio', ''),
        curso_division = nullif(metadata->>'curso_division', ''),
        integrantes = coalesce(metadata->'integrantes', '[]'::jsonb),
        telefono = nullif(metadata->>'telefono', ''),
        nombre_entidad = metadata->>'nombre_entidad',
        tipo_entidad = metadata->>'tipo_entidad',
        figura_legal = metadata->>'figura_legal',
        rubro = nullif(metadata->>'rubro', ''),
        descripcion = nullif(metadata->>'descripcion', ''),
        socio_mayor = nullif(metadata->>'socio_mayor', ''),
        socio_responsable = nullif(metadata->>'socio_responsable', ''),
        persona_juridica = nullif(metadata->>'persona_juridica', ''),
        responsable = nullif(metadata->>'responsable', ''),
        cargo_responsable = nullif(metadata->>'cargo_responsable', ''),
        cuit_simulado = nullif(metadata->>'cuit_simulado', ''),
        domicilio = nullif(metadata->>'domicilio', ''),
        actividad_principal = nullif(metadata->>'actividad_principal', '')
      where user_id = new.id
        and estado = 'pendiente';
    else
      insert into public.solicitudes_registro (
        user_id,
        nombre_alumno,
        email,
        curso,
        curso_anio,
        curso_division,
        integrantes,
        telefono,
        nombre_entidad,
        tipo_entidad,
        figura_legal,
        rubro,
        descripcion,
        socio_mayor,
        socio_responsable,
        persona_juridica,
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
        nullif(metadata->>'curso_anio', ''),
        nullif(metadata->>'curso_division', ''),
        coalesce(metadata->'integrantes', '[]'::jsonb),
        nullif(metadata->>'telefono', ''),
        metadata->>'nombre_entidad',
        metadata->>'tipo_entidad',
        metadata->>'figura_legal',
        nullif(metadata->>'rubro', ''),
        nullif(metadata->>'descripcion', ''),
        nullif(metadata->>'socio_mayor', ''),
        nullif(metadata->>'socio_responsable', ''),
        nullif(metadata->>'persona_juridica', ''),
        nullif(metadata->>'responsable', ''),
        nullif(metadata->>'cargo_responsable', ''),
        nullif(metadata->>'cuit_simulado', ''),
        nullif(metadata->>'domicilio', ''),
        nullif(metadata->>'actividad_principal', '')
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_registration on auth.users;
create trigger on_auth_user_created_registration
after insert on auth.users
for each row
execute function public.handle_new_registration_request();

revoke execute on function public.admin_list_profiles() from public;
grant execute on function public.admin_list_profiles() to authenticated;
revoke execute on function public.handle_new_registration_request() from public;
grant execute on function public.handle_new_registration_request() to authenticated;

notify pgrst, 'reload schema';
