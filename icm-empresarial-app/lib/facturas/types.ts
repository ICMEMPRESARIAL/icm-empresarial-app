export type FacturaEstado =
  | "borrador"
  | "emitida"
  | "recibida"
  | "pendiente_pago"
  | "pago_enviado"
  | "pagada"
  | "observada"
  | "rechazada"
  | "anulada"
  | "vencida";

export type PagoEstado = "enviado" | "observado" | "confirmado" | "rechazado";

export type MedioPago =
  | "transferencia_simulada"
  | "efectivo_simulado"
  | "cheque_simulado"
  | "banco"
  | "otro";

export type EmpresaMini = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  slug: string;
  tipo: "servicio" | "bien" | "organismo";
};

export type FacturaItem = {
  id: string;
  factura_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
};

export type Factura = {
  id: string;
  numero_factura: string;
  emisor_empresa_id: string;
  receptor_empresa_id: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  tipo_factura: string;
  estado: FacturaEstado;
  concepto: string | null;
  subtotal: number;
  iva: number;
  total: number;
  observaciones: string | null;
  registrado_en_regisoft: boolean;
  registrado_en_regisoft_at: string | null;
  registrado_en_regisoft_por: string | null;
  referencia_regisoft: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  emisor: EmpresaMini | null;
  receptor: EmpresaMini | null;
};

export type Pago = {
  id: string;
  factura_id: string;
  pagador_empresa_id: string;
  cobrador_empresa_id: string;
  importe: number;
  fecha_pago: string;
  medio_pago: MedioPago;
  numero_operacion: string | null;
  estado: PagoEstado;
  comprobante_path: string | null;
  observaciones: string | null;
  registrado_en_regisoft: boolean;
  registrado_en_regisoft_at: string | null;
  registrado_en_regisoft_por: string | null;
  referencia_regisoft: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  factura?: Pick<Factura, "id" | "numero_factura" | "total" | "estado"> | null;
  pagador: EmpresaMini | null;
  cobrador: EmpresaMini | null;
};

export type FacturaEvento = {
  id: string;
  factura_id: string;
  actor_id: string | null;
  actor_empresa_id: string | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  titulo: string;
  descripcion: string | null;
  created_at: string;
  actor_empresa: EmpresaMini | null;
};

export type FacturaDetail = Factura & {
  items: FacturaItem[];
  pagos: Pago[];
  eventos: FacturaEvento[];
};

export const mediosPago: MedioPago[] = [
  "transferencia_simulada",
  "efectivo_simulado",
  "cheque_simulado",
  "banco",
  "otro"
];
