create or replace function public.actualizar_contacto_email_empresa_admin(
  p_empresa_id uuid,
  p_contacto_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text;
begin
  if not public.is_profesora_admin() then
    raise exception 'Solo la profesora administradora puede editar emails de invitación.';
  end if;

  clean_email := nullif(lower(trim(coalesce(p_contacto_email, ''))), '');

  if clean_email is not null then
    if length(clean_email) > 254 then
      raise exception 'El email no puede superar 254 caracteres.';
    end if;

    if clean_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
      raise exception 'El email debe tener un formato válido.';
    end if;
  end if;

  update public.empresas
  set contacto_email = clean_email
  where id = p_empresa_id;

  if not found then
    raise exception 'Empresa no encontrada.';
  end if;
end;
$$;

revoke all on function public.actualizar_contacto_email_empresa_admin(uuid,text) from public;
grant execute on function public.actualizar_contacto_email_empresa_admin(uuid,text) to authenticated;
