alter table public.empresa_documentacion_legal
  add column if not exists categoria text,
  add column if not exists mes text,
  add column if not exists periodo_anio integer,
  add column if not exists tipo_movimiento text,
  add column if not exists origen text not null default 'manual',
  add column if not exists emitido_por text,
  add column if not exists archivo_nombre text,
  add column if not exists archivo_tipo text,
  add column if not exists archivo_size bigint,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists empresa_documentacion_legal_categoria_idx
  on public.empresa_documentacion_legal(categoria);

create index if not exists empresa_documentacion_legal_iva_periodo_idx
  on public.empresa_documentacion_legal(
    empresa_id,
    periodo_anio,
    mes,
    tipo_movimiento
  )
  where categoria = 'iva_compra_venta';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresa_documentacion_legal_tipo_movimiento_check'
      and conrelid = 'public.empresa_documentacion_legal'::regclass
  ) then
    alter table public.empresa_documentacion_legal
      add constraint empresa_documentacion_legal_tipo_movimiento_check
      check (
        tipo_movimiento is null
        or tipo_movimiento in ('compra', 'venta')
      ) not valid;
  end if;
end;
$$;

notify pgrst, 'reload schema';
