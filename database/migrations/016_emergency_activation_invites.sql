-- Flujo temporal de activacion propia para reemplazar inviteUserByEmail.
-- Los tokens se guardan solo hasheados y se consumen desde backend con service role.

create table if not exists public.user_activation_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  empresa_id uuid references public.empresas(id),
  email text not null,
  rol text not null check (rol in ('empresa', 'profesora_admin')),
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id),
  revoked_at timestamptz,
  sent_at timestamptz,
  last_send_attempt_at timestamptz,
  send_count integer not null default 0 check (send_count >= 0),
  send_status text not null default 'pendiente'
    check (send_status in ('pendiente', 'enviado', 'fallido', 'omitido')),
  send_error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_activation_invites_email_check check (
    length(email) <= 254
    and email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  ),
  constraint user_activation_invites_empresa_required check (
    (rol = 'empresa' and empresa_id is not null)
    or (rol = 'profesora_admin' and empresa_id is null)
  )
);

create index if not exists user_activation_invites_empresa_id_idx
  on public.user_activation_invites(empresa_id);

create index if not exists user_activation_invites_created_at_desc_idx
  on public.user_activation_invites(created_at desc);

create index if not exists user_activation_invites_email_idx
  on public.user_activation_invites(lower(email));

create unique index if not exists user_activation_invites_one_active_company_idx
  on public.user_activation_invites(empresa_id, lower(email), rol)
  where rol = 'empresa' and used_at is null and revoked_at is null;

create unique index if not exists user_activation_invites_one_active_professor_idx
  on public.user_activation_invites(lower(email), rol)
  where rol = 'profesora_admin' and used_at is null and revoked_at is null;

create or replace function public.touch_user_activation_invites_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_user_activation_invites_updated_at
on public.user_activation_invites;

create trigger touch_user_activation_invites_updated_at
before update on public.user_activation_invites
for each row
execute function public.touch_user_activation_invites_updated_at();

alter table public.user_activation_invites enable row level security;

-- Sin policies: anon/authenticated no pueden leer ni escribir tokens.
-- El acceso operativo ocurre solamente desde backend con service role.
revoke all on public.user_activation_invites from anon, authenticated;
