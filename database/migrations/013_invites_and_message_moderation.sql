-- MVP de invitaciones directas y moderacion de mensajes.
-- Mantiene el registro publico pendiente y agrega un flujo separado para invitados.

create table if not exists public.moderation_incidents (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid references public.empresas(id),
  destinatario_empresa_id uuid references public.empresas(id),
  correspondencia_id uuid references public.correspondencia(id) on delete set null,
  tipo text not null check (tipo in ('nuevo_mensaje', 'respuesta')),
  resultado text not null check (resultado in ('bloqueado', 'permitido_con_alerta')),
  categorias jsonb not null default '{}'::jsonb,
  contenido_excerpt text,
  fuente text not null default 'openai+local',
  created_at timestamptz not null default now()
);

alter table public.moderation_incidents enable row level security;

create index if not exists moderation_incidents_created_at_idx
  on public.moderation_incidents(created_at desc);
create index if not exists moderation_incidents_empresa_id_idx
  on public.moderation_incidents(empresa_id);

create policy "usuario registra incidente propio"
on public.moderation_incidents
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and (
    public.is_profesora_admin()
    or empresa_id = public.current_empresa_id()
  )
);

create policy "solo profesora ve incidentes"
on public.moderation_incidents
for select
to authenticated
using (public.is_profesora_admin());

revoke delete, update on public.moderation_incidents from authenticated;
grant select, insert on public.moderation_incidents to authenticated;

create or replace function public.handle_new_registration_request()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  metadata jsonb := new.raw_user_meta_data;
  invite_role text := nullif(metadata->>'icm_role', '');
  invite_empresa_id uuid;
begin
  -- Invitaciones generadas desde un entorno servidor de confianza.
  if coalesce(metadata->>'icm_invite', 'false') = 'true' then
    if invite_role = 'profesora_admin' then
      insert into public.profiles (id, nombre, rol, empresa_id, estado)
      values (
        new.id,
        coalesce(nullif(metadata->>'nombre', ''), new.email),
        'profesora_admin',
        null,
        'activo'
      )
      on conflict (id) do update
      set nombre = excluded.nombre,
          rol = 'profesora_admin',
          empresa_id = null,
          estado = 'activo';

      return new;
    end if;

    if invite_role = 'empresa' then
      invite_empresa_id := nullif(metadata->>'empresa_id', '')::uuid;

      if invite_empresa_id is null or not exists (
        select 1 from public.empresas e where e.id = invite_empresa_id and e.activo = true
      ) then
        raise exception 'La invitacion no tiene una empresa activa valida.';
      end if;

      insert into public.profiles (id, nombre, rol, empresa_id, estado)
      values (
        new.id,
        coalesce(nullif(metadata->>'nombre', ''), nullif(metadata->>'empresa_nombre', ''), new.email),
        'empresa',
        invite_empresa_id,
        'activo'
      )
      on conflict (id) do update
      set nombre = excluded.nombre,
          rol = 'empresa',
          empresa_id = excluded.empresa_id,
          estado = 'activo';

      return new;
    end if;

    raise exception 'Rol de invitacion ICM invalido.';
  end if;

  -- El registro publico anterior se conserva sin cambios: queda pendiente.
  if metadata ? 'nombre_entidad' then
    insert into public.profiles (id, nombre, rol, empresa_id, estado)
    values (
      new.id,
      coalesce(nullif(metadata->>'nombre_alumno', ''), new.email),
      'empresa',
      null,
      'pendiente'
    )
    on conflict (id) do update
    set nombre = excluded.nombre,
        rol = excluded.rol,
        estado = 'pendiente';

    insert into public.solicitudes_registro (
      user_id, nombre_alumno, email, curso, curso_anio, curso_division,
      integrantes, telefono, nombre_entidad, tipo_entidad, figura_legal,
      rubro, descripcion, socio_mayor, socio_responsable, persona_juridica,
      responsable, cargo_responsable, cuit_simulado, domicilio, actividad_principal
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