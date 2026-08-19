-- Onboarding obligatorio e identidad segura para empresas/organismos.
-- Esta migracion documenta y consolida cambios aplicados al entorno 2026.

alter table public.empresas
  add column if not exists onboarding_completo boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists subtipo_entidad text;

create index if not exists empresas_onboarding_completo_idx
  on public.empresas(onboarding_completo);

-- Clasificacion inicial no destructiva de las entidades ya conocidas.
update public.empresas
set subtipo_entidad = case
  when tipo = 'bien' then 'empresa_bienes'
  when tipo = 'servicio' then 'empresa_servicios'
  when nombre = 'ARCA' then 'arca'
  when nombre = 'ARBA' then 'arba'
  when nombre = 'Banco ICM' then 'banco'
  when nombre = 'Municipalidad de Chascomús' then 'municipalidad'
  when nombre = 'Sindicato' then 'sindicato'
  when nombre = 'DPPJ' then 'dppj'
  when nombre = 'Secretaría de Trabajo' then 'secretaria_trabajo'
  when nombre = 'Administración ICM' then 'administracion_icm'
  else subtipo_entidad
end
where subtipo_entidad is null;

create or replace function public.current_profile_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.estado = 'activo'
  );
$$;

create or replace function public.current_empresa_onboarding_completo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select e.onboarding_completo
      from public.empresas e
      where e.id = public.current_empresa_id()
    ),
    false
  );
$$;

revoke execute on function public.current_profile_activo() from public;
revoke execute on function public.current_empresa_onboarding_completo() from public;
grant execute on function public.current_profile_activo() to authenticated;
grant execute on function public.current_empresa_onboarding_completo() to authenticated;

-- Las policies usan los nombres que existen en el esquema productivo actual.
alter policy "empresa ve correspondencia propia"
on public.correspondencia
using (
  public.is_profesora_admin()
  or (
    public.current_profile_activo()
    and public.current_empresa_onboarding_completo()
    and (
      remitente_empresa_id = public.current_empresa_id()
      or destinatario_empresa_id = public.current_empresa_id()
    )
  )
);

alter policy "empresa envia correspondencia propia"
on public.correspondencia
with check (
  public.is_profesora_admin()
  or (
    public.current_profile_activo()
    and public.current_empresa_onboarding_completo()
    and remitente_empresa_id = public.current_empresa_id()
  )
);

alter policy "empresa actualiza correspondencia propia"
on public.correspondencia
using (
  public.is_profesora_admin()
  or (
    public.current_profile_activo()
    and public.current_empresa_onboarding_completo()
    and (
      remitente_empresa_id = public.current_empresa_id()
      or destinatario_empresa_id = public.current_empresa_id()
    )
  )
)
with check (
  public.is_profesora_admin()
  or (
    public.current_profile_activo()
    and public.current_empresa_onboarding_completo()
    and (
      remitente_empresa_id = public.current_empresa_id()
      or destinatario_empresa_id = public.current_empresa_id()
    )
  )
);

alter policy "empresa ve respuestas de conversaciones propias"
on public.correspondencia_respuestas
using (
  public.is_profesora_admin()
  or (
    public.current_profile_activo()
    and public.current_empresa_onboarding_completo()
    and exists (
      select 1
      from public.correspondencia c
      where c.id = correspondencia_respuestas.correspondencia_id
        and (
          c.remitente_empresa_id = public.current_empresa_id()
          or c.destinatario_empresa_id = public.current_empresa_id()
        )
    )
  )
);

alter policy "empresa responde conversaciones donde participa"
on public.correspondencia_respuestas
with check (
  public.is_profesora_admin()
  or (
    public.current_profile_activo()
    and public.current_empresa_onboarding_completo()
    and empresa_id = public.current_empresa_id()
    and exists (
      select 1
      from public.correspondencia c
      where c.id = correspondencia_respuestas.correspondencia_id
        and (
          c.remitente_empresa_id = public.current_empresa_id()
          or c.destinatario_empresa_id = public.current_empresa_id()
        )
    )
  )
);

-- Valida que cada integrante tenga identidad y rol completos.
create or replace function public.integrantes_validos(p_integrantes jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    jsonb_typeof(p_integrantes) = 'array'
    and jsonb_array_length(p_integrantes) >= 1
    and not exists (
      select 1
      from jsonb_array_elements(p_integrantes) item
      where nullif(trim(coalesce(item->>'nombre', '')), '') is null
         or nullif(trim(coalesce(item->>'email', '')), '') is null
         or nullif(trim(coalesce(item->>'rol', '')), '') is null
    );
$$;

create or replace function public.completar_mi_onboarding(
  p_integrantes jsonb,
  p_curso_anio text,
  p_curso_division text,
  p_contacto_email text,
  p_contacto_telefono text,
  p_responsable text,
  p_socio_responsable text,
  p_logo_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_tipo text;
begin
  v_empresa_id := public.current_empresa_id();

  if v_empresa_id is null then
    raise exception 'El usuario no está vinculado a una entidad.';
  end if;

  if not public.current_profile_activo() then
    raise exception 'La cuenta no está activa.';
  end if;

  select tipo
  into v_tipo
  from public.empresas
  where id = v_empresa_id
    and activo = true;

  if v_tipo is null then
    raise exception 'La entidad asociada no existe o está inactiva.';
  end if;

  if not public.integrantes_validos(p_integrantes) then
    raise exception 'Todos los integrantes deben tener nombre, email y rol o cargo.';
  end if;

  if nullif(trim(p_contacto_email), '') is null then
    raise exception 'El email de contacto es obligatorio.';
  end if;

  if v_tipo in ('bien', 'servicio') then
    if nullif(trim(p_curso_anio), '') is null then
      raise exception 'El año es obligatorio.';
    end if;

    if nullif(trim(p_curso_division), '') is null then
      raise exception 'La división es obligatoria.';
    end if;
  end if;

  update public.empresas
  set
    integrantes = p_integrantes,
    curso_anio = case when v_tipo in ('bien', 'servicio') then trim(p_curso_anio) else curso_anio end,
    curso_division = case when v_tipo in ('bien', 'servicio') then trim(p_curso_division) else curso_division end,
    contacto_email = lower(trim(p_contacto_email)),
    contacto_telefono = nullif(trim(p_contacto_telefono), ''),
    responsable = nullif(trim(p_responsable), ''),
    socio_responsable = nullif(trim(p_socio_responsable), ''),
    logo_url = nullif(trim(p_logo_url), ''),
    onboarding_completo = true,
    onboarding_completed_at = now()
  where id = v_empresa_id;
end;
$$;

-- Edicion posterior segura del logo: solo la propia entidad o profesora.
create or replace function public.actualizar_logo_empresa(
  p_empresa_id uuid,
  p_logo_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_profesora_admin() then
    if not public.current_profile_activo() or public.current_empresa_id() is distinct from p_empresa_id then
      raise exception 'No tenés permisos para modificar el logo de esta entidad.';
    end if;
  end if;

  update public.empresas
  set logo_url = nullif(trim(p_logo_url), '')
  where id = p_empresa_id;

  if not found then
    raise exception 'La entidad no existe.';
  end if;
end;
$$;

-- Edicion posterior segura de los campos permitidos del perfil.
create or replace function public.actualizar_perfil_empresa(
  p_empresa_id uuid,
  p_nombre_comercial text,
  p_color_marca text,
  p_slogan text,
  p_rubro text,
  p_actividad_principal text,
  p_responsable text,
  p_descripcion text,
  p_contacto_email text,
  p_contacto_telefono text,
  p_sitio_web text,
  p_instagram text,
  p_domicilio text,
  p_integrantes jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_profesora_admin() then
    if not public.current_profile_activo() or public.current_empresa_id() is distinct from p_empresa_id then
      raise exception 'No tenés permisos para modificar esta entidad.';
    end if;
  end if;

  if not public.integrantes_validos(p_integrantes) then
    raise exception 'Todos los integrantes deben tener nombre, email y rol o cargo.';
  end if;

  update public.empresas
  set
    actividad_principal = nullif(trim(p_actividad_principal), ''),
    color_marca = nullif(trim(p_color_marca), ''),
    contacto_email = nullif(lower(trim(p_contacto_email)), ''),
    contacto_telefono = nullif(trim(p_contacto_telefono), ''),
    descripcion = nullif(trim(p_descripcion), ''),
    domicilio = nullif(trim(p_domicilio), ''),
    instagram = nullif(trim(p_instagram), ''),
    integrantes = p_integrantes,
    nombre_comercial = nullif(trim(p_nombre_comercial), ''),
    responsable = nullif(trim(p_responsable), ''),
    rubro = nullif(trim(p_rubro), ''),
    sitio_web = nullif(trim(p_sitio_web), ''),
    slogan = nullif(trim(p_slogan), '')
  where id = p_empresa_id;

  if not found then
    raise exception 'La entidad no existe.';
  end if;
end;
$$;

revoke all on function public.completar_mi_onboarding(jsonb,text,text,text,text,text,text,text) from public;
revoke all on function public.actualizar_logo_empresa(uuid,text) from public;
revoke all on function public.actualizar_perfil_empresa(uuid,text,text,text,text,text,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.completar_mi_onboarding(jsonb,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.actualizar_logo_empresa(uuid,text) to authenticated;
grant execute on function public.actualizar_perfil_empresa(uuid,text,text,text,text,text,text,text,text,text,text,text,text,jsonb) to authenticated;

-- Storage del logo.
update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp']
where id = 'company-logos';

drop policy if exists "authenticated upload storage demo buckets" on storage.objects;
drop policy if exists "authenticated update storage demo buckets" on storage.objects;
drop policy if exists "authenticated upload other demo buckets" on storage.objects;
drop policy if exists "authenticated update other demo buckets" on storage.objects;
drop policy if exists "empresa sube logo propio" on storage.objects;
drop policy if exists "empresa actualiza logo propio" on storage.objects;
drop policy if exists "empresa elimina logo propio" on storage.objects;

create policy "authenticated upload other demo buckets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = any (array[
    'company-banners'::text,
    'company-products'::text,
    'company-legal-documents'::text,
    'payment-receipts'::text,
    'mailbox-attachments'::text
  ])
);

create policy "authenticated update other demo buckets"
on storage.objects
for update
to authenticated
using (
  bucket_id = any (array[
    'company-banners'::text,
    'company-products'::text,
    'company-legal-documents'::text,
    'payment-receipts'::text,
    'mailbox-attachments'::text
  ])
)
with check (
  bucket_id = any (array[
    'company-banners'::text,
    'company-products'::text,
    'company-legal-documents'::text,
    'payment-receipts'::text,
    'mailbox-attachments'::text
  ])
);

create policy "empresa sube logo propio"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-logos'
  and (
    public.is_profesora_admin()
    or (
      public.current_profile_activo()
      and (storage.foldername(name))[1] = public.current_empresa_id()::text
    )
  )
);

create policy "empresa actualiza logo propio"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'company-logos'
  and (
    public.is_profesora_admin()
    or (
      public.current_profile_activo()
      and (storage.foldername(name))[1] = public.current_empresa_id()::text
    )
  )
)
with check (
  bucket_id = 'company-logos'
  and (
    public.is_profesora_admin()
    or (
      public.current_profile_activo()
      and (storage.foldername(name))[1] = public.current_empresa_id()::text
    )
  )
);

create policy "empresa elimina logo propio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'company-logos'
  and (
    public.is_profesora_admin()
    or (
      public.current_profile_activo()
      and (storage.foldername(name))[1] = public.current_empresa_id()::text
    )
  )
);
