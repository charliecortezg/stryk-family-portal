import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import {
  INDICADORES_ACTITUD,
  INDICADORES_TECNICOS,
  LOGROS_POR_SEMANA,
  fechasDeSemana,
  rpc,
} from "@/lib/stryk";

export const Route = createFileRoute("/progreso/$codigo")({
  head: () => ({
    meta: [
      { title: "Progreso — STRYK" },
      { name: "description", content: "Portal familiar de STRYK." },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: Portal,
});

type PortalData = {
  jugador: { id: string; nombre: string; grupo: string; mes: string };
  config: { mes_activo: string; semana_activa: number };
  diarias: { fecha: string; semana: number; asistencia: string; esfuerzo: number | null; aplicacion_tactica: number | null; trabajo_equipo: number | null; comunicacion: number | null }[];
  tecnicas: { semana: number; indicador: string; valor: number; fecha: string }[];
  logros: { codigo: string; desbloqueado: boolean; fecha_desbloqueo: string | null }[];
  foto: { url: string; semana: number } | null;
  reporte: { mensaje: string; fecha: string } | null;
};

function Portal() {
  const { codigo } = Route.useParams();
  const [data, setData] = useState<PortalData | null | undefined>(undefined);

  useEffect(() => {
    rpc<PortalData | null>("get_portal_data", { p_codigo: codigo }).then(setData).catch(() => setData(null));
  }, [codigo]);

  if (data === undefined) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500">Cargando…</div>;
  }
  if (!data) {
    return (
      <div className="min-h-screen theme-light bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-card rounded-2xl p-8 shadow-lg">
          <Logo variant="mark" size={40} className="mx-auto text-slate-800" />
          <h1 className="mt-4 font-display text-2xl">Código no encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Verifica el código que te entregó tu coach.</p>
          <Link to="/" className="mt-6 inline-block h-10 px-5 rounded-xl bg-gold text-gold-foreground text-sm font-semibold leading-10">Ir al inicio</Link>
        </div>
      </div>
    );
  }

  return <PortalContent data={data} />;
}

function PortalContent({ data }: { data: PortalData }) {
  const { jugador, config, diarias, tecnicas, logros, foto, reporte } = data;
  const semanas = Array.from(new Set(diarias.map((d) => d.semana))).sort();
  const fechasSem = fechasDeSemana(jugador.mes, config.semana_activa);
  const dias = ["L", "M", "X", "J", "V"];
  const semanaMap = new Map(diarias.filter((d) => d.semana === config.semana_activa).map((d) => [d.fecha, d.asistencia]));

  const asistColor = (a?: string) => {
    if (a === "puntual") return "bg-emerald-500";
    if (a === "tardanza") return "bg-amber-500";
    if (a === "ausente") return "bg-red-500";
    return "bg-slate-300";
  };
  const puntualesMes = diarias.filter((d) => d.asistencia === "puntual").length;

  const promSem = (semana: number, k: string) => {
    const rows = diarias.filter((d) => d.semana === semana && d.asistencia !== "ausente");
    const vals = rows.map((r) => (r as unknown as Record<string, number | null>)[k]).filter((v): v is number => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const constancia = (semana: number) => {
    const rows = diarias.filter((d) => d.semana === semana);
    if (!rows.length) return null;
    return (rows.filter((r) => r.asistencia === "puntual").length / rows.length) * 5;
  };

  const desbloqueados = logros.filter((l) => l.desbloqueado).length;

  return (
    <div className="theme-light min-h-screen bg-background text-foreground">
      {/* Header oscuro */}
      <header className="bg-[#0F1729] text-white px-5 py-6">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Logo variant="mark" size={36} />
          <div className="flex-1">
            <div className="text-xs text-white/60">Hola, familia de</div>
            <div className="font-display text-xl leading-tight">{jugador.nombre}</div>
          </div>
          <span className="text-xs bg-white/10 rounded-full px-3 py-1 capitalize">Grupo {jugador.grupo} · {jugador.mes}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-5 space-y-6">
        {foto && (
          <section className="rounded-2xl overflow-hidden bg-card shadow-sm">
            <img src={foto.url} alt={`Semana ${foto.semana}`} className="w-full h-56 object-cover" />
            <div className="p-4 text-sm text-muted-foreground">Foto de la semana {foto.semana}</div>
          </section>
        )}

        {/* Asistencia */}
        <section className="rounded-2xl bg-card shadow-sm p-5">
          <h2 className="font-display text-lg">Asistencia · semana {config.semana_activa}</h2>
          <div className="mt-4 flex justify-between max-w-xs mx-auto">
            {fechasSem.map((f, i) => (
              <div key={f} className="text-center">
                <div className={`w-11 h-11 rounded-full ${asistColor(semanaMap.get(f))} flex items-center justify-center text-white font-display shadow`}>
                  {dias[i]}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">{puntualesMes} días puntuales este mes</div>
        </section>

        {/* Actitud */}
        <section className="rounded-2xl bg-card shadow-sm p-5">
          <h2 className="font-display text-lg">Progreso de actitud</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ...INDICADORES_ACTITUD.map((i) => ({ key: i.key, label: i.label })),
              { key: "__constancia", label: "Constancia" },
            ].map((ind) => (
              <div key={ind.key} className="rounded-xl bg-background/60 p-3">
                <div className="text-sm font-medium">{ind.label}</div>
                <div className="mt-2 flex items-end gap-2 h-16">
                  {semanas.map((s) => {
                    const v = ind.key === "__constancia" ? constancia(s) : promSem(s, ind.key);
                    const h = v == null ? 4 : (v / 5) * 100;
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-[#DDA82D]" style={{ height: `${h}%` }} title={v?.toFixed(1)} />
                        <div className="text-[10px] text-muted-foreground">S{s}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Técnicas */}
        <section className="rounded-2xl bg-card shadow-sm p-5">
          <h2 className="font-display text-lg">Habilidades técnicas</h2>
          {tecnicas.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Las evaluaciones técnicas aparecerán conforme avance el programa.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {[1, 2, 3, 4].map((s) => {
                const filas = tecnicas.filter((t) => t.semana === s);
                if (!filas.length) return null;
                return (
                  <div key={s}>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Semana {s}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {filas.map((t) => (
                        <div key={t.indicador} className="rounded-xl bg-background/60 p-3 flex justify-between items-center">
                          <span className="text-sm">{INDICADORES_TECNICOS[t.indicador]}</span>
                          <span className="font-display text-lg text-[#DDA82D]">{t.valor}/5</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Logros */}
        <section className="rounded-2xl bg-card shadow-sm p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Logros</h2>
            <span className="text-sm text-muted-foreground">{desbloqueados} de 16</span>
          </div>
          <div className="mt-4 space-y-5">
            {LOGROS_POR_SEMANA.map((sec) => (
              <div key={sec.titulo}>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{sec.titulo} — {sec.subtitulo}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {sec.logros.map((l) => {
                    const cur = logros.find((x) => x.codigo === l.codigo);
                    const on = cur?.desbloqueado ?? false;
                    return (
                      <div key={l.codigo} className={`rounded-xl p-3 border flex items-center gap-3 ${on ? "achievement-shine text-black border-transparent" : "bg-background/40 border-black/5 opacity-50"}`}>
                        <div className="text-2xl">{on ? "🏅" : "🔒"}</div>
                        <div className="text-xs font-medium leading-tight">{l.nombre}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reporte final */}
        {reporte && (
          <section className="rounded-2xl bg-card shadow-sm p-5 border-2 border-[#DDA82D]">
            <div className="text-xs uppercase tracking-widest text-[#DDA82D]">Reporte final</div>
            <h2 className="font-display text-xl mt-1">Comparativo S1 → S4</h2>
            <ComparativoTable diarias={diarias} tecnicas={tecnicas} />
            <h3 className="mt-6 font-display text-base">Mensaje del coach</h3>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{reporte.mensaje}</p>
            <div className="mt-4 text-xs text-muted-foreground">
              Reporte generado el {new Date(reporte.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-muted-foreground pb-4">
          White Lions Academy · Mexicali, B.C.
        </footer>
      </div>
    </div>
  );
}

type DiariaP = PortalData["diarias"][number];
type TecnicaP = PortalData["tecnicas"][number];

function ComparativoTable({ diarias, tecnicas }: { diarias: DiariaP[]; tecnicas: TecnicaP[] }) {
  const promSem = (semana: number, k: keyof DiariaP) => {
    const rows = diarias.filter((d) => d.semana === semana && d.asistencia !== "ausente");
    const vals = rows.map((r) => r[k]).filter((v): v is number => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const tecVal = (semana: number, ind: string) => {
    const row = tecnicas.find((t) => t.semana === semana && t.indicador === ind);
    return row ? row.valor : null;
  };
  const cambio = (a: number | null, b: number | null, decimals = 0) => {
    if (a == null || b == null) return { txt: "Sin comparativo", cls: "text-slate-400" };
    const d = b - a;
    const sign = d > 0 ? "+" : "";
    const arrow = d > 0 ? "↑" : d < 0 ? "↓" : "=";
    const cls = d > 0 ? "text-emerald-600" : d < 0 ? "text-red-500" : "text-amber-500";
    return { txt: `${sign}${d.toFixed(decimals)} ${arrow}`, cls };
  };
  const actitud = [
    { k: "esfuerzo" as const, label: "Esfuerzo y actitud" },
    { k: "aplicacion_tactica" as const, label: "Aplicación táctica" },
    { k: "trabajo_equipo" as const, label: "Trabajo en equipo" },
    { k: "comunicacion" as const, label: "Comunicación en campo" },
  ];
  const tecnica: [string, string][] = [
    ["conduccion", "Conducción controlada"],
    ["pase", "Pase con precisión"],
    ["recepcion", "Recepción limpia"],
    ["control_aereo", "Control aéreo con pecho"],
    ["remate", "Remate orientado"],
  ];

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="text-left py-2">Indicador</th>
            <th className="text-center py-2">S1</th>
            <th className="text-center py-2">S4</th>
            <th className="text-center py-2">Cambio</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={4} className="pt-3 pb-1 text-xs uppercase tracking-widest text-[#DDA82D]">Actitud (promedio del mes)</td></tr>
          {actitud.map((ind) => {
            const a = promSem(1, ind.k); const b = promSem(4, ind.k);
            const c = cambio(a, b, 1);
            return (
              <tr key={ind.k} className="border-t border-black/5">
                <td className="py-2">{ind.label}</td>
                <td className="text-center">{a?.toFixed(1) ?? "—"}</td>
                <td className="text-center">{b?.toFixed(1) ?? "—"}</td>
                <td className={`text-center font-medium ${c.cls}`}>{c.txt}</td>
              </tr>
            );
          })}
          <tr><td colSpan={4} className="pt-4 pb-1 text-xs uppercase tracking-widest text-[#DDA82D]">Técnica</td></tr>
          {tecnica.map(([key, label]) => {
            const a = tecVal(1, key); const b = tecVal(4, key);
            const c = cambio(a, b, 0);
            return (
              <tr key={key} className="border-t border-black/5">
                <td className="py-2">{label}</td>
                <td className="text-center">{a ?? "—"}</td>
                <td className="text-center">{b ?? "—"}</td>
                <td className={`text-center font-medium ${c.cls}`}>{c.txt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
