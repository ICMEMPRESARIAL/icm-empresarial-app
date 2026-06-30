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

do $$
begin
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

update public.empresas
set
  logo_url = coalesce(logo_url, logo),
  nombre_comercial = coalesce(nombre_comercial, nombre),
  razon_social = coalesce(razon_social, nombre)
where logo is not null
  or nombre_comercial is null
  or razon_social is null;

create or replace function public.empresa_campos_protegidos_sin_cambios(
  target_empresa_id uuid,
  new_nombre text,
  new_slug text,
  new_tipo text,
  new_logo text,
  new_figura_legal text,
  new_razon_social text,
  new_cuit_simulado text,
  new_curso_anio text,
  new_curso_division text,
  new_persona_juridica text,
  new_socio_responsable text,
  new_sitio_externo text,
  new_visible_en_directorio boolean,
  new_activo boolean,
  new_publicado boolean,
  new_created_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empresas e
    where e.id = target_empresa_id
      and e.nombre is not distinct from new_nombre
      and e.slug is not distinct from new_slug
      and e.tipo is not distinct from new_tipo
      and e.logo is not distinct from new_logo
      and e.figura_legal is not distinct from new_figura_legal
      and e.razon_social is not distinct from new_razon_social
      and e.cuit_simulado is not distinct from new_cuit_simulado
      and e.curso_anio is not distinct from new_curso_anio
      and e.curso_division is not distinct from new_curso_division
      and e.persona_juridica is not distinct from new_persona_juridica
      and e.socio_responsable is not distinct from new_socio_responsable
      and e.sitio_externo is not distinct from new_sitio_externo
      and e.visible_en_directorio is not distinct from new_visible_en_directorio
      and e.activo is not distinct from new_activo
      and e.publicado is not distinct from new_publicado
      and e.created_at is not distinct from new_created_at
  )
$$;

drop policy if exists "empresa activa actualiza perfil propio" on public.empresas;
create policy "empresa activa actualiza perfil propio"
on public.empresas
for update
to authenticated
using (
  id = public.current_empresa_id()
  and public.current_profile_estado() = 'activo'
)
with check (
  id = public.current_empresa_id()
  and public.current_profile_estado() = 'activo'
  and public.empresa_campos_protegidos_sin_cambios(
    id,
    nombre,
    slug,
    tipo,
    logo,
    figura_legal,
    razon_social,
    cuit_simulado,
    curso_anio,
    curso_division,
    persona_juridica,
    socio_responsable,
    sitio_externo,
    visible_en_directorio,
    activo,
    publicado,
    created_at
  )
);

revoke execute on function public.empresa_campos_protegidos_sin_cambios(
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
  text,
  text,
  boolean,
  boolean,
  boolean,
  timestamptz
) from public;

grant execute on function public.empresa_campos_protegidos_sin_cambios(
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
  text,
  text,
  boolean,
  boolean,
  boolean,
  timestamptz
) to authenticated;
