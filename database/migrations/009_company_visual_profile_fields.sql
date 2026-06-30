alter table public.empresas
  add column if not exists logo_url text,
  add column if not exists banner_url text,
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
  add column if not exists contacto_telefono text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresas_figura_legal_check'
      and conrelid = 'public.empresas'::regclass
  ) then
    alter table public.empresas
      add constraint empresas_figura_legal_check
      check (
        figura_legal is null
        or figura_legal in (
          'monotributo',
          'sas',
          'organismo_publico',
          'banco'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresas_curso_anio_check'
      and conrelid = 'public.empresas'::regclass
  ) then
    alter table public.empresas
      add constraint empresas_curso_anio_check
      check (curso_anio is null or curso_anio in ('4', '5', '6'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresas_curso_division_check'
      and conrelid = 'public.empresas'::regclass
  ) then
    alter table public.empresas
      add constraint empresas_curso_division_check
      check (curso_division is null or curso_division in ('A', 'B', 'C'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresas_integrantes_array_check'
      and conrelid = 'public.empresas'::regclass
  ) then
    alter table public.empresas
      add constraint empresas_integrantes_array_check
      check (jsonb_typeof(integrantes) = 'array');
  end if;
end;
$$;

create index if not exists empresas_figura_legal_idx
  on public.empresas(figura_legal);
create index if not exists empresas_curso_anio_division_idx
  on public.empresas(curso_anio, curso_division);

update public.empresas
set
  logo_url = coalesce(logo_url, logo),
  nombre_comercial = coalesce(nombre_comercial, nombre),
  razon_social = coalesce(razon_social, nombre)
where logo is not null
  or nombre_comercial is null
  or razon_social is null;

create or replace function public.update_empresa_visual_profile(
  target_empresa_id uuid,
  new_logo_url text default null,
  new_banner_url text default null,
  new_color_marca text default null,
  new_slogan text default null,
  new_descripcion text default null,
  new_rubro text default null,
  new_domicilio text default null,
  new_actividad_principal text default null,
  new_contacto_email text default null,
  new_contacto_telefono text default null,
  new_nombre_comercial text default null
)
returns public.empresas
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_empresa public.empresas;
begin
  if not (
    public.is_profesora_admin()
    or target_empresa_id = public.current_empresa_id()
  ) then
    raise exception 'No tenes permisos para editar esta empresa.';
  end if;

  if public.current_profile_estado() <> 'activo'
    and not public.is_profesora_admin()
  then
    raise exception 'La cuenta debe estar activa para editar la empresa.';
  end if;

  update public.empresas
  set
    logo_url = coalesce(new_logo_url, logo_url),
    banner_url = coalesce(new_banner_url, banner_url),
    color_marca = coalesce(new_color_marca, color_marca),
    slogan = coalesce(new_slogan, slogan),
    descripcion = coalesce(new_descripcion, descripcion),
    rubro = coalesce(new_rubro, rubro),
    domicilio = coalesce(new_domicilio, domicilio),
    actividad_principal = coalesce(new_actividad_principal, actividad_principal),
    contacto_email = coalesce(new_contacto_email, contacto_email),
    contacto_telefono = coalesce(new_contacto_telefono, contacto_telefono),
    nombre_comercial = coalesce(new_nombre_comercial, nombre_comercial)
  where id = target_empresa_id
  returning * into updated_empresa;

  if updated_empresa.id is null then
    raise exception 'Empresa no encontrada.';
  end if;

  return updated_empresa;
end;
$$;

revoke execute on function public.update_empresa_visual_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.update_empresa_visual_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
