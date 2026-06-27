alter table public.solicitudes_registro
  add column if not exists curso_anio text,
  add column if not exists curso_division text,
  add column if not exists integrantes jsonb not null default '[]'::jsonb,
  add column if not exists socio_responsable text,
  add column if not exists persona_juridica text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'solicitudes_registro_curso_anio_check'
      and conrelid = 'public.solicitudes_registro'::regclass
  ) then
    alter table public.solicitudes_registro
      add constraint solicitudes_registro_curso_anio_check
      check (curso_anio in ('4', '5', '6'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'solicitudes_registro_curso_division_check'
      and conrelid = 'public.solicitudes_registro'::regclass
  ) then
    alter table public.solicitudes_registro
      add constraint solicitudes_registro_curso_division_check
      check (curso_division in ('A', 'B', 'C'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'solicitudes_registro_integrantes_array_check'
      and conrelid = 'public.solicitudes_registro'::regclass
  ) then
    alter table public.solicitudes_registro
      add constraint solicitudes_registro_integrantes_array_check
      check (jsonb_typeof(integrantes) = 'array');
  end if;
end;
$$;

create index if not exists solicitudes_registro_curso_anio_idx
  on public.solicitudes_registro(curso_anio);
create index if not exists solicitudes_registro_curso_division_idx
  on public.solicitudes_registro(curso_division);

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

  return new;
end;
$$;
