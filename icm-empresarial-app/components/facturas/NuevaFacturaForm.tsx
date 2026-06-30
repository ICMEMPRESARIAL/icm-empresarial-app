"use client";

import { Plus, Send } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { createFacturaAction } from "@/lib/facturas/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
type DestinatarioFactura = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
};

type ItemDraft = {
  cantidad: string;
  descripcion: string;
  precio_unitario: string;
};

const initialState = { error: null };
const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

function itemSubtotal(item: ItemDraft) {
  const cantidad = Number(item.cantidad);
  const precio = Number(item.precio_unitario);
  return Number.isFinite(cantidad) && Number.isFinite(precio) ? cantidad * precio : 0;
}

export function NuevaFacturaForm({
  destinatarios
}: {
  destinatarios: DestinatarioFactura[];
}) {
  const [state, formAction, isPending] = useActionState(
    createFacturaAction,
    initialState
  );
  const [items, setItems] = useState<ItemDraft[]>([
    { cantidad: "1", descripcion: "", precio_unitario: "0" }
  ]);
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + itemSubtotal(item), 0),
    [items]
  );
  const iva = Math.round(subtotal * 0.21 * 100) / 100;
  const total = Math.round((subtotal + iva) * 100) / 100;
  const itemsJson = JSON.stringify(
    items.map((item) => ({
      cantidad: Number(item.cantidad),
      descripcion: item.descripcion,
      precio_unitario: Number(item.precio_unitario)
    }))
  );

  function updateItem(index: number, field: keyof ItemDraft, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  return (
    <Card>
      <form action={formAction} className="space-y-5">
        <input name="items_json" type="hidden" value={itemsJson} />
        {state.error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {state.error}
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Empresa receptora
            <select className={inputClass} name="receptor_empresa_id" required>
              <option value="">Seleccionar empresa</option>
              {destinatarios.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre_comercial ?? empresa.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Fecha de vencimiento
            <input className={inputClass} name="fecha_vencimiento" type="date" />
          </label>
        </div>
        <label className="block text-sm font-medium text-ink">
          Concepto
          <input className={inputClass} name="concepto" required />
        </label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Ítems</h2>
            <Button
              className="gap-2"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  { cantidad: "1", descripcion: "", precio_unitario: "0" }
                ])
              }
              type="button"
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
          {items.map((item, index) => (
            <div className="grid gap-3 rounded-xl border border-border bg-surface p-3 md:grid-cols-[1fr_90px_140px]" key={index}>
              <input
                className={inputClass}
                onChange={(event) =>
                  updateItem(index, "descripcion", event.target.value)
                }
                placeholder="Descripción"
                required
                value={item.descripcion}
              />
              <input
                className={inputClass}
                min="1"
                onChange={(event) =>
                  updateItem(index, "cantidad", event.target.value)
                }
                type="number"
                value={item.cantidad}
              />
              <input
                className={inputClass}
                min="0"
                onChange={(event) =>
                  updateItem(index, "precio_unitario", event.target.value)
                }
                step="0.01"
                type="number"
                value={item.precio_unitario}
              />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <div className="mt-1 flex justify-between">
            <span>IVA simulado 21%</span>
            <strong>${iva.toFixed(2)}</strong>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-base">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </div>
        <label className="block text-sm font-medium text-ink">
          Observaciones
          <textarea
            className="mt-2 min-h-24 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            name="observaciones"
          />
        </label>
        <div className="flex justify-end">
          <Button className="gap-2" disabled={isPending} type="submit">
            <Send className="h-4 w-4" />
            {isPending ? "Emitiendo..." : "Emitir factura"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
