export type EmpresaTipo = "servicio" | "bien" | "organismo";

export type Empresa = {
  id: string;
  nombre: string;
  slug: string;
  tipo: EmpresaTipo;
  rubro: string | null;
  descripcion: string | null;
  logo: string | null;
  color_marca: string | null;
  sitio_externo: string | null;
  visible_en_directorio: boolean;
  activo: boolean;
  created_at: string;
};
