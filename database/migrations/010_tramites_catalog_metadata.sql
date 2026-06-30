alter table public.tipos_tramite
  add column if not exists categoria text;

alter table public.tipos_tramite
  add column if not exists documentacion_esperada text;

alter table public.tramites
  add column if not exists created_by uuid references auth.users(id);

alter table public.tramites
  add column if not exists titulo text;

alter table public.tramites
  add column if not exists datos_formulario jsonb not null default '{}'::jsonb;

alter table public.tramites
  add column if not exists prioridad text not null default 'normal';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tramites_prioridad_check'
      and conrelid = 'public.tramites'::regclass
  ) then
    alter table public.tramites
      add constraint tramites_prioridad_check
      check (prioridad in ('baja', 'normal', 'alta'));
  end if;
end
$$;

update public.tipos_tramite
set categoria = case organismo_slug
  when 'arca' then 'Fiscal nacional'
  when 'arba' then 'Fiscal provincial'
  when 'dppj' then 'Societario'
  when 'municipalidad' then 'Habilitaciones'
  when 'secretaria-de-trabajo' then 'Laboral'
  when 'sindicato' then 'Sindical'
  else categoria
end
where categoria is null;

update public.tipos_tramite
set documentacion_esperada = case
  when requiere_adjunto = true then 'Adjuntá la documentación respaldatoria indicada por el organismo para revisar el expediente.'
  else documentacion_esperada
end
where documentacion_esperada is null;
