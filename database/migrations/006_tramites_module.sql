create table if not exists public.tipos_tramite (
  id uuid primary key default gen_random_uuid(),
  organismo_empresa_id uuid not null references public.empresas(id),
  organismo_slug text not null,
  nombre text not null,
  slug text not null,
  descripcion text,
  requiere_adjunto boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tipos_tramite_slug_unique unique (organismo_slug, slug)
);

create table if not exists public.tramites (
  id uuid primary key default gen_random_uuid(),
  tipo_tramite_id uuid not null references public.tipos_tramite(id),
  solicitante_empresa_id uuid not null references public.empresas(id),
  organismo_empresa_id uuid not null references public.empresas(id),
  estado text not null default 'solicitud_enviada' check (
    estado in (
      'solicitud_enviada',
      'recibida_por_organismo',
      'en_revision',
      'observada',
      'documentacion_requerida',
      'documentacion_enviada',
      'aprobada',
      'rechazada',
      'finalizada'
    )
  ),
  asunto text not null,
  descripcion text not null,
  numero_expediente text,
  observacion_actual text,
  oculto boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalizado_at timestamptz
);

create table if not exists public.tramite_eventos (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references public.tramites(id),
  actor_id uuid references auth.users(id),
  actor_empresa_id uuid references public.empresas(id),
  estado text not null check (
    estado in (
      'solicitud_enviada',
      'recibida_por_organismo',
      'en_revision',
      'observada',
      'documentacion_requerida',
      'documentacion_enviada',
      'aprobada',
      'rechazada',
      'finalizada'
    )
  ),
  titulo text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

create table if not exists public.tramite_comentarios (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references public.tramites(id),
  actor_id uuid not null references auth.users(id),
  actor_empresa_id uuid references public.empresas(id),
  contenido text not null,
  interno boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tramite_adjuntos (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references public.tramites(id),
  actor_id uuid not null references auth.users(id),
  actor_empresa_id uuid references public.empresas(id),
  nombre_archivo text not null,
  url text,
  descripcion text,
  created_at timestamptz not null default now()
);

alter table public.tipos_tramite enable row level security;
alter table public.tramites enable row level security;
alter table public.tramite_eventos enable row level security;
alter table public.tramite_comentarios enable row level security;
alter table public.tramite_adjuntos enable row level security;

create index if not exists tipos_tramite_organismo_empresa_id_idx
  on public.tipos_tramite(organismo_empresa_id);
create index if not exists tipos_tramite_organismo_slug_idx
  on public.tipos_tramite(organismo_slug);
create index if not exists tramites_solicitante_empresa_id_idx
  on public.tramites(solicitante_empresa_id);
create index if not exists tramites_organismo_empresa_id_idx
  on public.tramites(organismo_empresa_id);
create index if not exists tramites_estado_idx on public.tramites(estado);
create index if not exists tramites_created_at_desc_idx
  on public.tramites(created_at desc);
create index if not exists tramite_eventos_tramite_id_idx
  on public.tramite_eventos(tramite_id);
create index if not exists tramite_comentarios_tramite_id_idx
  on public.tramite_comentarios(tramite_id);
create index if not exists tramite_adjuntos_tramite_id_idx
  on public.tramite_adjuntos(tramite_id);

create or replace function public.participa_en_tramite(target_tramite_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tramites t
    where t.id = target_tramite_id
      and (
        t.solicitante_empresa_id = public.current_empresa_id()
        or t.organismo_empresa_id = public.current_empresa_id()
      )
  )
$$;

create or replace function public.es_organismo_responsable_tramite(
  target_tramite_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tramites t
    where t.id = target_tramite_id
      and t.organismo_empresa_id = public.current_empresa_id()
  )
$$;

drop policy if exists "tipos tramite visibles" on public.tipos_tramite;
create policy "tipos tramite visibles"
on public.tipos_tramite
for select
to authenticated
using (
  public.is_profesora_admin()
  or activo = true
);

drop policy if exists "solo admin gestiona tipos tramite" on public.tipos_tramite;
drop policy if exists "solo admin inserta tipos tramite" on public.tipos_tramite;
create policy "solo admin inserta tipos tramite"
on public.tipos_tramite
for insert
to authenticated
with check (public.is_profesora_admin());

drop policy if exists "solo admin actualiza tipos tramite" on public.tipos_tramite;
create policy "solo admin actualiza tipos tramite"
on public.tipos_tramite
for update
to authenticated
using (public.is_profesora_admin())
with check (public.is_profesora_admin());

drop policy if exists "usuarios ven tramites participantes" on public.tramites;
create policy "usuarios ven tramites participantes"
on public.tramites
for select
to authenticated
using (
  public.is_profesora_admin()
  or (
    oculto = false
    and public.participa_en_tramite(id)
  )
);

drop policy if exists "solicitantes crean tramites propios" on public.tramites;
create policy "solicitantes crean tramites propios"
on public.tramites
for insert
to authenticated
with check (
  public.current_profile_estado() = 'activo'
  and solicitante_empresa_id = public.current_empresa_id()
);

drop policy if exists "organismo actualiza tramites recibidos" on public.tramites;
create policy "organismo actualiza tramites recibidos"
on public.tramites
for update
to authenticated
using (
  public.is_profesora_admin()
  or public.es_organismo_responsable_tramite(id)
)
with check (
  public.is_profesora_admin()
  or public.es_organismo_responsable_tramite(id)
);

drop policy if exists "usuarios ven eventos de tramites participantes" on public.tramite_eventos;
create policy "usuarios ven eventos de tramites participantes"
on public.tramite_eventos
for select
to authenticated
using (
  public.is_profesora_admin()
  or public.participa_en_tramite(tramite_id)
);

drop policy if exists "participantes crean eventos de tramite" on public.tramite_eventos;
create policy "participantes crean eventos de tramite"
on public.tramite_eventos
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or public.participa_en_tramite(tramite_id)
);

drop policy if exists "usuarios ven comentarios de tramites participantes" on public.tramite_comentarios;
create policy "usuarios ven comentarios de tramites participantes"
on public.tramite_comentarios
for select
to authenticated
using (
  public.is_profesora_admin()
  or (
    public.participa_en_tramite(tramite_id)
    and (
      interno = false
      or public.es_organismo_responsable_tramite(tramite_id)
    )
  )
);

drop policy if exists "participantes comentan tramites" on public.tramite_comentarios;
create policy "participantes comentan tramites"
on public.tramite_comentarios
for insert
to authenticated
with check (
  public.current_profile_estado() = 'activo'
  and (
    public.is_profesora_admin()
    or (
      public.participa_en_tramite(tramite_id)
      and actor_id = auth.uid()
      and actor_empresa_id = public.current_empresa_id()
    )
  )
);

drop policy if exists "usuarios ven adjuntos de tramites participantes" on public.tramite_adjuntos;
create policy "usuarios ven adjuntos de tramites participantes"
on public.tramite_adjuntos
for select
to authenticated
using (
  public.is_profesora_admin()
  or public.participa_en_tramite(tramite_id)
);

drop policy if exists "participantes adjuntan documentacion" on public.tramite_adjuntos;
create policy "participantes adjuntan documentacion"
on public.tramite_adjuntos
for insert
to authenticated
with check (
  public.current_profile_estado() = 'activo'
  and (
    public.is_profesora_admin()
    or (
      public.participa_en_tramite(tramite_id)
      and actor_id = auth.uid()
      and actor_empresa_id = public.current_empresa_id()
    )
  )
);

revoke all on public.tipos_tramite from anon, authenticated;
revoke all on public.tramites from anon, authenticated;
revoke all on public.tramite_eventos from anon, authenticated;
revoke all on public.tramite_comentarios from anon, authenticated;
revoke all on public.tramite_adjuntos from anon, authenticated;

grant select, insert, update on public.tipos_tramite to authenticated;
grant select, insert on public.tramites to authenticated;
grant update (
  estado,
  numero_expediente,
  observacion_actual,
  oculto,
  updated_at,
  finalizado_at
) on public.tramites to authenticated;
grant select, insert on public.tramite_eventos to authenticated;
grant select, insert on public.tramite_comentarios to authenticated;
grant select, insert on public.tramite_adjuntos to authenticated;

revoke execute on function public.participa_en_tramite(uuid) from public;
revoke execute on function public.es_organismo_responsable_tramite(uuid) from public;
grant execute on function public.participa_en_tramite(uuid) to authenticated;
grant execute on function public.es_organismo_responsable_tramite(uuid) to authenticated;

insert into public.empresas (
  nombre,
  slug,
  tipo,
  rubro,
  descripcion,
  color_marca,
  visible_en_directorio,
  activo
)
values
  (
    'ARCA',
    'arca',
    'organismo',
    'Tributario nacional',
    'Organismo interno para inscripciones, altas de actividad, presentaciones fiscales, consultas y reclamos.',
    '#1f4f8f',
    true,
    true
  ),
  (
    'ARBA',
    'arba',
    'organismo',
    'Tributario provincial',
    'Organismo interno para altas provinciales, declaraciones juradas, constancias y reclamos tributarios.',
    '#0f766e',
    true,
    true
  ),
  (
    'DPPJ',
    'dppj',
    'organismo',
    'Personas jurídicas',
    'Organismo interno para reserva de nombre, inscripción SAS, rúbrica de libros y presentación societaria.',
    '#7c3aed',
    true,
    true
  ),
  (
    'Municipalidad',
    'municipalidad',
    'organismo',
    'Habilitaciones municipales',
    'Organismo interno para habilitaciones comerciales, tasas, inspecciones y reclamos municipales.',
    '#b45309',
    true,
    true
  ),
  (
    'Secretaría de Trabajo',
    'secretaria-de-trabajo',
    'organismo',
    'Trabajo y seguridad social',
    'Organismo interno para datos laborales, rúbricas, nóminas, libros de sueldo y capacitación.',
    '#0369a1',
    true,
    true
  ),
  (
    'Sindicato',
    'sindicato',
    'organismo',
    'Relaciones sindicales',
    'Organismo interno para boletas sindicales, afiliaciones, nóminas y reclamos sindicales.',
    '#be123c',
    true,
    true
  )
on conflict (slug) do update
set
  nombre = excluded.nombre,
  tipo = excluded.tipo,
  rubro = excluded.rubro,
  descripcion = excluded.descripcion,
  color_marca = excluded.color_marca,
  visible_en_directorio = excluded.visible_en_directorio,
  activo = excluded.activo;

with catalogo(organismo_slug, slug, nombre, descripcion, requiere_adjunto) as (
  values
    ('arca', 'inscripcion-fiscal-simulada', 'Inscripción fiscal simulada', 'Alta fiscal nacional dentro de la simulación empresarial.', true),
    ('arca', 'alta-de-actividad', 'Alta de actividad', 'Registro o modificación de actividad económica simulada.', false),
    ('arca', 'presentacion-fiscal', 'Presentación fiscal', 'Presentación periódica o especial ante ARCA.', true),
    ('arca', 'consulta-fiscal', 'Consulta fiscal', 'Consulta formal sobre situación o trámite fiscal.', false),
    ('arca', 'reclamo-ante-arca', 'Reclamo ante ARCA', 'Reclamo por una presentación, deuda o trámite fiscal.', false),
    ('arca', 'historial-de-presentaciones', 'Historial de presentaciones', 'Solicitud de revisión del historial fiscal interno.', false),
    ('arba', 'alta-provincial-simulada', 'Alta provincial simulada', 'Alta provincial en la simulación tributaria.', true),
    ('arba', 'declaracion-jurada-provincial', 'Presentación de declaración jurada provincial', 'Presentación de declaración jurada provincial.', true),
    ('arba', 'consulta-de-deuda-provincial', 'Consulta de deuda provincial', 'Consulta de deuda o estado tributario provincial.', false),
    ('arba', 'constancia-provincial', 'Constancia provincial', 'Solicitud de constancia provincial simulada.', false),
    ('arba', 'reclamo-tributario-provincial', 'Reclamo tributario provincial', 'Reclamo ante ARBA por situación tributaria provincial.', false),
    ('dppj', 'reserva-de-nombre', 'Reserva de nombre', 'Solicitud de reserva de nombre societario.', false),
    ('dppj', 'inscripcion-sas', 'Inscripción SAS', 'Inicio de inscripción de una Sociedad por Acciones Simplificada.', true),
    ('dppj', 'rubrica-de-libros', 'Rúbrica de libros', 'Solicitud de rúbrica de libros societarios.', true),
    ('dppj', 'emision-de-tasas', 'Emisión de tasas', 'Solicitud de emisión de tasas societarias.', false),
    ('dppj', 'presentacion-contrato-sas', 'Presentación de contrato SAS', 'Presentación de contrato SAS para revisión interna.', true),
    ('dppj', 'presentacion-libro-actas', 'Presentación de libro de actas', 'Presentación de libro de actas.', true),
    ('dppj', 'presentacion-libro-diario', 'Presentación de libro diario', 'Presentación de libro diario.', true),
    ('dppj', 'presentacion-libro-inventario-balance', 'Presentación de libro inventario y balance', 'Presentación de libro inventario y balance.', true),
    ('dppj', 'presentacion-libro-accionistas', 'Presentación de libro de accionistas', 'Presentación de libro de accionistas.', true),
    ('municipalidad', 'habilitacion-comercial', 'Solicitud de habilitación comercial', 'Solicitud de habilitación para local comercial.', true),
    ('municipalidad', 'emision-tasa-municipal', 'Emisión de tasa municipal', 'Solicitud de boleta o tasa municipal.', false),
    ('municipalidad', 'renovacion-habilitacion', 'Renovación de habilitación', 'Renovación de habilitación comercial.', true),
    ('municipalidad', 'solicitud-inspeccion', 'Solicitud de inspección', 'Pedido de inspección municipal.', false),
    ('municipalidad', 'reclamo-municipal', 'Reclamo municipal', 'Reclamo ante Municipalidad.', false),
    ('secretaria-de-trabajo', 'actualizacion-datos', 'Actualización de datos', 'Actualización de datos laborales de la empresa.', false),
    ('secretaria-de-trabajo', 'rubrica-libro-sueldos-digital', 'Rúbrica de libro de sueldos digital', 'Rúbrica digital del libro de sueldos.', true),
    ('secretaria-de-trabajo', 'rubrica-planilla-horaria', 'Rúbrica de planilla horaria', 'Rúbrica de planilla de horarios.', true),
    ('secretaria-de-trabajo', 'presentacion-libro-sueldos', 'Presentación de libro de sueldos', 'Presentación mensual de libro de sueldos.', true),
    ('secretaria-de-trabajo', 'presentacion-nomina-empleados', 'Presentación de nómina de empleados', 'Presentación de nómina de empleados.', true),
    ('secretaria-de-trabajo', 'capacitacion-personal', 'Capacitación del personal', 'Constancia y seguimiento de capacitación del personal.', true),
    ('sindicato', 'generar-boleta-sindicato', 'Generar boleta Sindicato', 'Generación de boleta sindical.', false),
    ('sindicato', 'generar-boleta-inacap', 'Generar boleta INACAP', 'Generación de boleta INACAP.', false),
    ('sindicato', 'generar-boleta-faecys', 'Generar boleta FAECYS', 'Generación de boleta FAECYS.', false),
    ('sindicato', 'alta-afiliado', 'Alta de afiliado', 'Alta de afiliado sindical.', true),
    ('sindicato', 'presentacion-nomina-empleados', 'Presentación de nómina de empleados', 'Presentación de nómina para sindicato.', true),
    ('sindicato', 'reclamo-sindical', 'Reclamo sindical', 'Reclamo ante sindicato.', false)
)
insert into public.tipos_tramite (
  organismo_empresa_id,
  organismo_slug,
  slug,
  nombre,
  descripcion,
  requiere_adjunto,
  activo
)
select
  e.id,
  c.organismo_slug,
  c.slug,
  c.nombre,
  c.descripcion,
  c.requiere_adjunto,
  true
from catalogo c
join public.empresas e on e.slug = c.organismo_slug
on conflict (organismo_slug, slug) do update
set
  organismo_empresa_id = excluded.organismo_empresa_id,
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  requiere_adjunto = excluded.requiere_adjunto,
  activo = true;
