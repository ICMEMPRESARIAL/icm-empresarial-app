alter table public.empresas enable row level security;
alter table public.profiles enable row level security;
alter table public.correspondencia enable row level security;
alter table public.correspondencia_respuestas enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id
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
  )
$$;

create or replace function public.participa_en_correspondencia(
  target_correspondencia_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.correspondencia c
    where c.id = target_correspondencia_id
      and (
        c.remitente_empresa_id = public.current_empresa_id()
        or c.destinatario_empresa_id = public.current_empresa_id()
      )
  )
$$;

create or replace function public.set_correspondencia_remitente_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_profesora_admin() then
    new.remitente_empresa_id := public.current_empresa_id();
  end if;

  return new;
end;
$$;

create trigger set_correspondencia_remitente_before_insert
before insert on public.correspondencia
for each row
execute function public.set_correspondencia_remitente_from_profile();

create or replace function public.set_respuesta_empresa_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_profesora_admin() then
    new.empresa_id := public.current_empresa_id();
  end if;

  return new;
end;
$$;

create trigger set_respuesta_empresa_before_insert
before insert on public.correspondencia_respuestas
for each row
execute function public.set_respuesta_empresa_from_profile();

create policy "empresas visibles para usuarios autenticados"
on public.empresas
for select
to authenticated
using (
  public.is_profesora_admin()
  or (
    activo = true
    and (
      visible_en_directorio = true
      or id = public.current_empresa_id()
    )
  )
);

create policy "solo admin inserta empresas"
on public.empresas
for insert
to authenticated
with check (public.is_profesora_admin());

create policy "solo admin actualiza empresas"
on public.empresas
for update
to authenticated
using (public.is_profesora_admin())
with check (public.is_profesora_admin());

create policy "usuarios ven su perfil"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_profesora_admin()
);

create policy "solo admin inserta perfiles"
on public.profiles
for insert
to authenticated
with check (public.is_profesora_admin());

create policy "solo admin actualiza perfiles"
on public.profiles
for update
to authenticated
using (public.is_profesora_admin())
with check (public.is_profesora_admin());

create policy "empresas ven correspondencia propia"
on public.correspondencia
for select
to authenticated
using (
  public.is_profesora_admin()
  or (
    oculto = false
    and public.participa_en_correspondencia(id)
  )
);

create policy "empresas crean correspondencia propia"
on public.correspondencia
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or (
    remitente_empresa_id = public.current_empresa_id()
    and estado = 'enviado'
    and reportado = false
    and oculto = false
    and read_at is null
  )
);

create policy "empresas actualizan estado de correspondencia propia"
on public.correspondencia
for update
to authenticated
using (
  public.is_profesora_admin()
  or (
    oculto = false
    and public.participa_en_correspondencia(id)
  )
)
with check (
  public.is_profesora_admin()
  or (
    oculto = false
    and public.participa_en_correspondencia(id)
  )
);

create policy "empresas ven respuestas propias"
on public.correspondencia_respuestas
for select
to authenticated
using (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.correspondencia c
    where c.id = correspondencia_respuestas.correspondencia_id
      and c.oculto = false
      and (
        c.remitente_empresa_id = public.current_empresa_id()
        or c.destinatario_empresa_id = public.current_empresa_id()
      )
  )
);

create policy "empresas responden conversaciones donde participan"
on public.correspondencia_respuestas
for insert
to authenticated
with check (
  public.is_profesora_admin()
  or (
    empresa_id = public.current_empresa_id()
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

create policy "solo admin ve auditoria"
on public.audit_logs
for select
to authenticated
using (public.is_profesora_admin());

create policy "usuarios registran auditoria propia"
on public.audit_logs
for insert
to authenticated
with check (
  actor_id = auth.uid()
  or public.is_profesora_admin()
);

revoke all on public.empresas from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.correspondencia from anon, authenticated;
revoke all on public.correspondencia_respuestas from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant usage on schema public to authenticated;

grant select, insert, update on public.empresas to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.correspondencia to authenticated;
grant update (estado, reportado, oculto, read_at)
  on public.correspondencia to authenticated;
grant select, insert on public.correspondencia_respuestas to authenticated;
grant select, insert on public.audit_logs to authenticated;

revoke execute on function public.current_empresa_id() from public;
revoke execute on function public.is_profesora_admin() from public;
revoke execute on function public.participa_en_correspondencia(uuid) from public;

grant execute on function public.current_empresa_id() to authenticated;
grant execute on function public.is_profesora_admin() to authenticated;
grant execute on function public.participa_en_correspondencia(uuid) to authenticated;
