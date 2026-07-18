import { supabase } from "@/integrations/supabase/client";

export const INDICADORES_ACTITUD = [
  { key: "esfuerzo", label: "Esfuerzo y actitud" },
  { key: "aplicacion_tactica", label: "Aplicación táctica" },
  { key: "trabajo_equipo", label: "Trabajo en equipo" },
  { key: "comunicacion", label: "Comunicación en campo" },
] as const;

export const INDICADORES_10 = [
  { icon: "🕒", nombre: "Asistencia puntual" },
  { icon: "🔥", nombre: "Esfuerzo y actitud" },
  { icon: "🧠", nombre: "Aplicación táctica" },
  { icon: "🤝", nombre: "Trabajo en equipo" },
  { icon: "📣", nombre: "Comunicación en campo" },
  { icon: "⚽", nombre: "Conducción controlada" },
  { icon: "🎯", nombre: "Pase con precisión" },
  { icon: "🧤", nombre: "Recepción limpia" },
  { icon: "🦅", nombre: "Control aéreo" },
  { icon: "🥅", nombre: "Remate orientado" },
];

export const INDICADORES_TECNICOS: Record<string, string> = {
  conduccion: "Conducción controlada",
  pase: "Pase con precisión",
  recepcion: "Recepción limpia",
  control_aereo: "Control aéreo con pecho",
  remate: "Remate orientado",
};

export const TECNICAS_ORDEN = ["conduccion", "pase", "recepcion", "control_aereo", "remate"] as const;

export const TECNICAS_POR_SEMANA: Record<number, string[]> = {
  1: ["conduccion", "pase", "recepcion", "control_aereo", "remate"],
  2: ["pase", "recepcion", "control_aereo", "remate"],
  3: ["conduccion"],
  4: ["conduccion", "pase", "recepcion", "control_aereo", "remate"],
};

export interface LogroDef {
  codigo: string;
  nombre: string;
}

export const LOGROS_POR_SEMANA: { titulo: string; subtitulo: string; logros: LogroDef[] }[] = [
  {
    titulo: "Semana 1",
    subtitulo: "Fundamentos",
    logros: [
      { codigo: "slalom_no_dominante", nombre: "Slalom con pie no dominante" },
      { codigo: "control_orientado", nombre: "Control orientado en partido" },
      { codigo: "dos_v_uno", nombre: "2v1 anotado" },
      { codigo: "torneo_rondos", nombre: "Torneo de rondos participado" },
    ],
  },
  {
    titulo: "Semana 2",
    subtitulo: "Conexión",
    logros: [
      { codigo: "pase_preciso", nombre: "Pase preciso a 10m" },
      { codigo: "control_pecho", nombre: "Control con pecho limpio" },
      { codigo: "pared", nombre: "La pared 1-2 ejecutada" },
      { codigo: "gol_empeine", nombre: "Gol de empeine anotado" },
    ],
  },
  {
    titulo: "Semana 3",
    subtitulo: "Coerver",
    logros: [
      { codigo: "inside_cut", nombre: "Inside cut dominado" },
      { codigo: "outside_cut", nombre: "Outside cut ejecutado" },
      { codigo: "uno_v_uno_of", nombre: "1v1 ofensivo ganado" },
      { codigo: "uno_v_uno_def", nombre: "1v1 defensivo ganado" },
    ],
  },
  {
    titulo: "Semana 4",
    subtitulo: "Pressing",
    logros: [
      { codigo: "pressing_activado", nombre: "Pressing activado a señal" },
      { codigo: "pressing_banda", nombre: "Pressing de banda aplicado" },
      { codigo: "tercer_hombre", nombre: "Tercer hombre ejecutado" },
      { codigo: "mini_copa", nombre: "Mini Copa participado" },
    ],
  },
];

export const MESES = ["junio", "julio", "agosto"] as const;

// ---- Fecha Tijuana ----
export function tijuanaHoy(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tijuana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export function fechaLarga(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Fechas de cada semana por mes (lunes-viernes)
const MES_INICIO: Record<string, [number, number, number]> = {
  junio: [2026, 6, 1],
  julio: [2026, 7, 20],
  agosto: [2026, 8, 3],
};

export function fechasDeSemana(mes: string, semana: number): string[] {
  const [y, mo, d] = MES_INICIO[mes] ?? MES_INICIO.julio;
  const start = new Date(Date.UTC(y, mo - 1, d + (semana - 1) * 7));
  return Array.from({ length: 5 }, (_, i) => {
    const dt = new Date(start);
    dt.setUTCDate(start.getUTCDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

// ---- Sesiones ----
const COACH_KEY = "stryk_coach_pin";
const COACH_EXP = "stryk_coach_exp";
const ADMIN_KEY = "stryk_admin_pass";

export function guardarPinCoach(pin: string) {
  localStorage.setItem(COACH_KEY, pin);
  localStorage.setItem(COACH_EXP, String(Date.now() + 12 * 3600 * 1000));
}
export function obtenerPinCoach(): string | null {
  const exp = Number(localStorage.getItem(COACH_EXP) ?? "0");
  if (Date.now() > exp) {
    localStorage.removeItem(COACH_KEY);
    localStorage.removeItem(COACH_EXP);
    return null;
  }
  return localStorage.getItem(COACH_KEY);
}
export function cerrarCoach() {
  localStorage.removeItem(COACH_KEY);
  localStorage.removeItem(COACH_EXP);
}

export function guardarPassAdmin(p: string) {
  sessionStorage.setItem(ADMIN_KEY, p);
}
export function obtenerPassAdmin(): string | null {
  return sessionStorage.getItem(ADMIN_KEY);
}
export function cerrarAdmin() {
  sessionStorage.removeItem(ADMIN_KEY);
}

// ---- RPC helper ----
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}
