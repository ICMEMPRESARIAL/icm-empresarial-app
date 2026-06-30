create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  numero_factura text unique not null,
  emisor_empresa_id uuid not null references public.empresas(id),
  receptor_empresa_id uuid not null references public.empresas(id),
  fecha_emision date not null default current_date,
  fecha_vencimiento date,
  tipo_factura text not null default 'simulada',
  estado text not null default 'emitida' check (
    estado in (
      'borrador',
      'emitida',
      'recibida',
      'pendiente_pago',
      'pago_enviado',
      'pagada',
      'observada',
      'rechazada',
      'anulada',
      'vencida'
    )
  ),
  concepto text,
  subtotal numeric not null default 0,
  iva numeric not null default 0,
  total numeric not null default 0,
  observaciones text,
  registrado_en_regisoft boolean not null default false,
  registrado_en_regisoft_at timestamptz,
  registrado_en_regisoft_por uuid references auth.users(id),
  referencia_regisoft text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.factura_items (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id) on delete cascade,
  descripcion text not null,
  cantidad numeric not null default 1,
  precio_unitario numeric not null default 0,
  subtotal numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id),
  pagador_empresa_id uuid not null references public.empresas(id),
  cobrador_empresa_id uuid not null references public.empresas(id),
  importe numeric not null,
  fecha_pago date not null default current_date,
  medio_pago text not null check (
    medio_pago in (
      'transferencia_simulada',
      'efectivo_simulado',
      'cheque_simulado',
      'banco',
      'otro'
    )
  ),
  numero_operacion text,
  estado text not null default 'enviado' check (
    estado in ('enviado', 'observado', 'confirmado', 'rechazado')
  ),
  comprobante_path text,
  observaciones text,
  registrado_en_regisoft boolean not null default false,
  registrado_en_regisoft_at timestamptz,
  registrado_en_regisoft_por uuid references auth.users(id),
  referencia_regisoft text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.factura_eventos (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id) on delete cascade,
  actor_id uuid references auth.users(id),
  actor_empresa_id uuid references public.empresas(id),
  estado_anterior text,
  estado_nuevo text,
  titulo text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

create index if not exists facturas_emisor_idx on public.facturas(emisor_empresa_id);
create index if not exists facturas_receptor_idx on public.facturas(receptor_empresa_id);
create index if not exists facturas_estado_idx on public.facturas(estado);
create index if not exists facturas_created_at_idx on public.facturas(created_at desc);
create index if not exists facturas_regisoft_idx on public.facturas(registrado_en_regisoft);
create index if not exists factura_items_factura_idx on public.factura_items(factura_id);
create index if not exists pagos_factura_idx on public.pagos(factura_id);
create index if not exists pagos_pagador_idx on public.pagos(pagador_empresa_id);
create index if not exists pagos_cobrador_idx on public.pagos(cobrador_empresa_id);
create index if not exists pagos_estado_idx on public.pagos(estado);
create index if not exists pagos_regisoft_idx on public.pagos(registrado_en_regisoft);
create index if not exists factura_eventos_factura_idx on public.factura_eventos(factura_id);

alter table public.facturas enable row level security;
alter table public.factura_items enable row level security;
alter table public.pagos enable row level security;
alter table public.factura_eventos enable row level security;

drop policy if exists "facturas_select_participantes_o_admin" on public.facturas;
create policy "facturas_select_participantes_o_admin"
on public.facturas for select
using (
  public.is_profesora_admin()
  or emisor_empresa_id = public.current_empresa_id()
  or receptor_empresa_id = public.current_empresa_id()
  or public.es_estudio_contable_asignado(emisor_empresa_id)
  or public.es_estudio_contable_asignado(receptor_empresa_id)
);

drop policy if exists "facturas_insert_emisor_o_admin" on public.facturas;
create policy "facturas_insert_emisor_o_admin"
on public.facturas for insert
with check (
  public.is_profesora_admin()
  or emisor_empresa_id = public.current_empresa_id()
);

drop policy if exists "facturas_update_participantes_o_admin" on public.facturas;
create policy "facturas_update_participantes_o_admin"
on public.facturas for update
using (
  public.is_profesora_admin()
  or emisor_empresa_id = public.current_empresa_id()
  or receptor_empresa_id = public.current_empresa_id()
)
with check (
  public.is_profesora_admin()
  or emisor_empresa_id = public.current_empresa_id()
  or receptor_empresa_id = public.current_empresa_id()
);

drop policy if exists "factura_items_select_por_factura" on public.factura_items;
create policy "factura_items_select_por_factura"
on public.factura_items for select
using (
  exists (
    select 1
    from public.facturas f
    where f.id = factura_items.factura_id
  )
);

drop policy if exists "factura_items_insert_emisor_o_admin" on public.factura_items;
create policy "factura_items_insert_emisor_o_admin"
on public.factura_items for insert
with check (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.facturas f
    where f.id = factura_items.factura_id
      and f.emisor_empresa_id = public.current_empresa_id()
  )
);

drop policy if exists "pagos_select_participantes_o_admin" on public.pagos;
create policy "pagos_select_participantes_o_admin"
on public.pagos for select
using (
  public.is_profesora_admin()
  or pagador_empresa_id = public.current_empresa_id()
  or cobrador_empresa_id = public.current_empresa_id()
  or public.es_estudio_contable_asignado(pagador_empresa_id)
  or public.es_estudio_contable_asignado(cobrador_empresa_id)
);

drop policy if exists "pagos_insert_pagador_o_admin" on public.pagos;
create policy "pagos_insert_pagador_o_admin"
on public.pagos for insert
with check (
  public.is_profesora_admin()
  or pagador_empresa_id = public.current_empresa_id()
);

drop policy if exists "pagos_update_participantes_o_admin" on public.pagos;
create policy "pagos_update_participantes_o_admin"
on public.pagos for update
using (
  public.is_profesora_admin()
  or pagador_empresa_id = public.current_empresa_id()
  or cobrador_empresa_id = public.current_empresa_id()
)
with check (
  public.is_profesora_admin()
  or pagador_empresa_id = public.current_empresa_id()
  or cobrador_empresa_id = public.current_empresa_id()
);

drop policy if exists "factura_eventos_select_por_factura" on public.factura_eventos;
create policy "factura_eventos_select_por_factura"
on public.factura_eventos for select
using (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.facturas f
    where f.id = factura_eventos.factura_id
      and (
        f.emisor_empresa_id = public.current_empresa_id()
        or f.receptor_empresa_id = public.current_empresa_id()
        or public.es_estudio_contable_asignado(f.emisor_empresa_id)
        or public.es_estudio_contable_asignado(f.receptor_empresa_id)
      )
  )
);

drop policy if exists "factura_eventos_insert_participantes_o_admin" on public.factura_eventos;
create policy "factura_eventos_insert_participantes_o_admin"
on public.factura_eventos for insert
with check (
  public.is_profesora_admin()
  or exists (
    select 1
    from public.facturas f
    where f.id = factura_eventos.factura_id
      and (
        f.emisor_empresa_id = public.current_empresa_id()
        or f.receptor_empresa_id = public.current_empresa_id()
      )
  )
);

revoke delete on public.facturas from authenticated;
revoke delete on public.factura_items from authenticated;
revoke delete on public.pagos from authenticated;
revoke delete on public.factura_eventos from authenticated;

grant select, insert, update on public.facturas to authenticated;
grant select, insert on public.factura_items to authenticated;
grant select, insert, update on public.pagos to authenticated;
grant select, insert on public.factura_eventos to authenticated;
