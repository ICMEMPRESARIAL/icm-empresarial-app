import type { EmpresaTipo } from "@/lib/empresas/types";

export type CorrespondenciaTipo =
  | "consulta"
  | "pedido"
  | "reclamo"
  | "factura_simulada"
  | "oficio"
  | "notificacion";

export type CorrespondenciaEstado =
  | "enviado"
  | "leido"
  | "respondido"
  | "archivado";

export type BuzonFilter =
  | "recibidos"
  | "enviados"
  | "archivados"
  | "reportados"
  | "todos";

export type EmpresaMini = {
  color_marca: string | null;
  id: string;
  logo_url: string | null;
  nombre: string;
  nombre_comercial: string | null;
  slug: string;
  tipo: EmpresaTipo;
};

export type CorrespondenciaListItem = {
  id: string;
  remitente_empresa_id: string;
  destinatario_empresa_id: string;
  tipo: CorrespondenciaTipo;
  asunto: string;
  contenido: string;
  estado: CorrespondenciaEstado;
  reportado: boolean;
  oculto: boolean;
  created_at: string;
  read_at: string | null;
  remitente: EmpresaMini | null;
  destinatario: EmpresaMini | null;
};

export type CorrespondenciaDetail = CorrespondenciaListItem;

export type CorrespondenciaRespuesta = {
  id: string;
  correspondencia_id: string;
  empresa_id: string;
  contenido: string;
  created_at: string;
  empresa: EmpresaMini | null;
};

export const correspondenciaTipos: CorrespondenciaTipo[] = [
  "consulta",
  "pedido",
  "reclamo",
  "factura_simulada",
  "oficio",
  "notificacion"
];
