alter table public.profiles
  add column if not exists estado text not null default 'activo',
  add column if not exists suspendido_motivo text,
  add column if not exists suspendido_at timestamptz,
  add column if not exists suspendido_por uuid references auth.users(id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_estado_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_estado_check
      check (estado in ('activo', 'suspendido', 'dado_de_baja'));
  end if;
end;
$$;

create index if not exists profiles_estado_idx on public.profiles(estado);
create index if not exists profiles_rol_idx on public.profiles(rol);

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

revoke execute on function public.current_profile_estado() from public;
revoke execute on function public.admin_list_profiles() from public;

grant execute on function public.current_profile_estado() to authenticated;
grant execute on function public.admin_list_profiles() to authenticated;
