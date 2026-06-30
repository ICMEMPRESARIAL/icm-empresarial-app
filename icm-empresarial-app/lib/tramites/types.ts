import type { EmpresaMini } from "@/lib/buzon/types";

export type TramiteEstado =
  | "solicitud_enviada"
  | "recibida_por_organismo"
  | "en_revision"
  | "observada"
  | "documentacion_requerida"
  | "documentacion_enviada"
  | "aprobada"
  | "rechazada"
  | "finalizada";

export type TipoTramite = {
  id: string;
  organismo_empresa_id: string;
  organismo_slug: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  categoria: string | null;
  documentacion_esperada: string | null;
  requiere_adjunto: boolean;
  activo: boolean;
  created_at: string;
  organismo: EmpresaMini | null;
};

export type TramiteListItem = {
  id: string;
  tipo_tramite_id: string;
  solicitante_empresa_id: string;
  organismo_empresa_id: string;
  estado: TramiteEstado;
  asunto: string;
  descripcion: string;
  numero_expediente: string | null;
  observacion_actual: string | null;
  oculto: boolean;
  created_at: string;
  updated_at: string;
  finalizado_at: string | null;
  tipo_tramite: Pick<
    TipoTramite,
    | "id"
    | "nombre"
    | "slug"
    | "organismo_slug"
    | "categoria"
    | "requiere_adjunto"
  > | null;
  solicitante: EmpresaMini | null;
  organismo: EmpresaMini | null;
};

export type TramiteDetail = TramiteListItem;

export type TramiteEvento = {
  id: string;
  tramite_id: string;
  actor_id: string | null;
  actor_empresa_id: string | null;
  estado: TramiteEstado;
  titulo: string;
  descripcion: string | null;
  created_at: string;
  actor_empresa: EmpresaMini | null;
};

export type TramiteComentario = {
  id: string;
  tramite_id: string;
  actor_id: string;
  actor_empresa_id: string | null;
  contenido: string;
  interno: boolean;
  created_at: string;
  actor_empresa: EmpresaMini | null;
};

export type TramiteAdjunto = {
  id: string;
  tramite_id: string;
  actor_id: string;
  actor_empresa_id: string | null;
  nombre_archivo: string;
  url: string | null;
  descripcion: string | null;
  created_at: string;
  actor_empresa: EmpresaMini | null;
};

export const tramiteEstados: TramiteEstado[] = [
  "solicitud_enviada",
  "recibida_por_organismo",
  "en_revision",
  "observada",
  "documentacion_requerida",
  "documentacion_enviada",
  "aprobada",
  "rechazada",
  "finalizada"
];

export const tramiteEstadoLabels: Record<TramiteEstado, string> = {
  aprobada: "Aprobada",
  documentacion_enviada: "Documentación enviada",
  documentacion_requerida: "Documentación requerida",
  en_revision: "En revisión",
  finalizada: "Finalizada",
  observada: "Observada",
  recibida_por_organismo: "Recibida por organismo",
  rechazada: "Rechazada",
  solicitud_enviada: "Solicitud enviada"
};
