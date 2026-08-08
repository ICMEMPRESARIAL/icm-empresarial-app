import type { Empresa } from "@/lib/empresas/types";

export type EmpresaWeb = {
  id: string;
  empresa_id: string;
  slogan: string | null;
  descripcion_inicio: string | null;
  banner_url: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  condiciones_contratacion: string | null;
  created_at: string;
  updated_at: string;
};

export type EmpresaProductoTipo = "producto" | "servicio";
export type EmpresaProductoModalidad =
  | "unica"
  | "mensual"
  | "bimestral"
  | "trimestral";

export type EmpresaProducto = {
  id: string;
  empresa_id: string;
  nombre: string;
  tipo: EmpresaProductoTipo;
  categoria: string | null;
  descripcion: string | null;
  precio_simulado: number | null;
  modalidad: EmpresaProductoModalidad;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentoLegalEstado =
  | "pendiente"
  | "presentado"
  | "observado"
  | "aprobado"
  | "rechazado";

export type EmpresaDocumentoLegal = {
  id: string;
  empresa_id: string;
  tipo_documento: string;
  titulo: string;
  descripcion: string | null;
  categoria: string | null;
  mes: string | null;
  periodo_anio: number | null;
  tipo_movimiento: string | null;
  origen: string;
  emitido_por: string | null;
  visible_publicamente: boolean;
  orden: number;
  estado: DocumentoLegalEstado;
  archivo_path: string | null;
  archivo_nombre: string | null;
  archivo_tipo: string | null;
  archivo_size: number | null;
  observacion: string | null;
  revisado_por: string | null;
  revisado_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type IvaMovimiento = "compra" | "venta";

export const ivaMeses = [
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre"
] as const;

export type IvaMes = (typeof ivaMeses)[number];

export const ivaMesLabels: Record<IvaMes, string> = {
  abril: "Abril",
  agosto: "Agosto",
  julio: "Julio",
  junio: "Junio",
  mayo: "Mayo",
  noviembre: "Noviembre",
  octubre: "Octubre",
  septiembre: "Septiembre"
};

export const ivaMovimientoLabels: Record<IvaMovimiento, string> = {
  compra: "Compra PDF",
  venta: "Venta PDF"
};

export type RevisionContableEstado =
  | "pendiente"
  | "en_revision"
  | "observado"
  | "aprobado";

export type EmpresaRevisionContable = {
  id: string;
  empresa_id: string;
  estudio_contable_empresa_id: string | null;
  estado: RevisionContableEstado;
  observaciones_generales: string | null;
  created_at: string;
  updated_at: string;
  empresa?: Pick<Empresa, "id" | "nombre" | "nombre_comercial" | "slug"> | null;
  estudio_contable?: Pick<Empresa, "id" | "nombre" | "nombre_comercial" | "slug"> | null;
};

export type EmpresaSiteData = {
  empresa: Empresa;
  web: EmpresaWeb | null;
  productos: EmpresaProducto[];
  documentos: EmpresaDocumentoLegal[];
  revision: EmpresaRevisionContable | null;
};

export const documentoLegalTipos = [
  "constancia_arca",
  "constancia_arba",
  "inscripcion_dppj",
  "habilitacion_municipal",
  "libro_diario",
  "libro_inventario_balance",
  "libro_actas",
  "contrato_social",
  "estatuto",
  "planilla_horaria",
  "libro_sueldos",
  "otros"
] as const;

export const documentoLegalLabels: Record<string, string> = {
  constancia_arba: "Constancia ARBA",
  constancia_arca: "Constancia ARCA",
  contrato_social: "Contrato social",
  estatuto: "Estatuto",
  habilitacion_municipal: "Habilitación municipal",
  inscripcion_dppj: "Inscripción DPPJ",
  iva_compra: "IVA Compras",
  iva_venta: "IVA Ventas",
  libro_actas: "Libro de Actas",
  libro_diario: "Libro Diario",
  libro_inventario_balance: "Libro Inventario y Balance",
  libro_sueldos: "Libro de Sueldos",
  otros: "Otros",
  planilla_horaria: "Planilla horaria"
};
