export type EmpresaTipo = "servicio" | "bien" | "organismo";
export type EmpresaFiguraLegal =
  | "monotributo"
  | "sas"
  | "organismo_publico"
  | "banco";

export type EmpresaIntegrante = {
  email?: string;
  nombre: string;
  rol?: string;
};

export type Empresa = {
  id: string;
  nombre: string;
  slug: string;
  tipo: EmpresaTipo;
  rubro: string | null;
  descripcion: string | null;
  logo: string | null;
  logo_url: string | null;
  banner_url: string | null;
  color_marca: string | null;
  figura_legal: EmpresaFiguraLegal | null;
  razon_social: string | null;
  nombre_comercial: string | null;
  slogan: string | null;
  cuit_simulado: string | null;
  domicilio: string | null;
  actividad_principal: string | null;
  curso_anio: "4" | "5" | "6" | null;
  curso_division: "A" | "B" | "C" | null;
  integrantes: EmpresaIntegrante[];
  responsable: string | null;
  persona_juridica: string | null;
  socio_responsable: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  sitio_externo: string | null;
  visible_en_directorio: boolean;
  activo: boolean;
  created_at: string;
};
