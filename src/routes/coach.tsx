import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import {
  INDICADORES_ACTITUD,
  INDICADORES_TECNICOS,
  LOGROS_POR_SEMANA,
  TECNICAS_POR_SEMANA,
  cerrarCoach,
  guardarPinCoach,
  obtenerPinCoach,
  rpc,
  tijuanaHoy,
} from "@/lib/stryk";

export const Route = createFileRoute("/coach")({
  head: () => ({ meta: [{ title: "Coach — STRYK" }, { name: "robots", content: "noindex" }] }),
  ssr: false,
  component: CoachPage,
});

type EvalRow = {
  jugador_id: string;
  nombre: string;
  asistencia: string | null;
  esfuerzo: number | null;
  aplicacion_tactica: number | null;
  trabajo_equipo: number | null;
  comunicacion: number | null;
  nota_coach: string | null;
};

type Cfg = { mes_activo: string; semana_activa: number; fecha_inicio: string };
type Logro = { logro_codigo: string; desbloqueado: boolean };


function CoachPage() {
  const [pin, setPin] = useState<string | null>(null);
  useEffect(() => setPin(obtenerPinCoach()), []);
  if (!pin) return <PinScreen onOk={(p) => setPin(p)} />;
  return <CoachApp pin={pin} onLogout={() => { cerrarCoach(); setPin(null); }} />;
}

function PinScreen({ onOk }: { onOk: (pin: string) => void }) {
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (pin: string) => {
    setLoading(true);
    try {
      const ok = await rpc<boolean>("verificar_pin", { p_pin: pin });
      if (!ok) { toast.error("PIN incorrecto"); setVal(""); }
      else { guardarPinCoach(pin); onOk(pin); }
    } catch (e) { toast.error(String(e)); }
    finally { setLoading(false); }
  };

  const press = (d: string) => {
    if (loading) return;
    if (d === "←") return setVal((v) => v.slice(0, -1));
    if (val.length >= 4) return;
    const n = val + d;
    setVal(n);
    if (n.length === 4) submit(n);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Logo variant="full" size={56} />
      <h1 className="mt-10 text-2xl font-display">Ingresa tu PIN</h1>
      <div className="mt-8 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-14 h-16 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-3xl font-display">
            {val[i] ? "•" : ""}
          </div>
        ))}
      </div>
      <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-xs">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map((k, i) => (
          <button key={i} disabled={!k || loading} onClick={() => k && press(k)}
            className="h-16 rounded-xl bg-surface border border-white/10 text-2xl font-display active:bg-gold active:text-gold-foreground disabled:opacity-30 transition">
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

const NOMBRES_SEMANA: Record<number, string> = {
  1: "Fundamentos",
  2: "Conexión y definición",
  3: "Habilidad individual",
  4: "Pressing + tercer hombre",
};

function fechaLargaCorta(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC", day: "numeric", month: "long",
  }).format(date);
}

type EstadoCurso =
  | { tipo: "antes"; inicioTexto: string }
  | { tipo: "en_curso"; semanaReal: number }
  | { tipo: "despues" }
  | { tipo: "sin_fecha" };

function estadoCurso(fechaInicio: string | undefined, hoy: string): EstadoCurso {
  if (!fechaInicio) return { tipo: "sin_fecha" };
  const d1 = new Date(fechaInicio + "T00:00:00");
  const d2 = new Date(hoy + "T00:00:00");
  const dias = Math.floor((d2.getTime() - d1.getTime()) / 86400000);
  if (dias < 0) return { tipo: "antes", inicioTexto: fechaLargaCorta(fechaInicio) };
  const s = Math.floor(dias / 7) + 1;
  if (s >= 1 && s <= 4) return { tipo: "en_curso", semanaReal: s };
  return { tipo: "despues" };
}

function diasCurso(fechaInicio: string | undefined): string[] {
  if (!fechaInicio) return [];
  const [y, m, d] = fechaInicio.split("-").map(Number);
  const out: string[] = [];
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < 5; i++) {
      const dt = new Date(Date.UTC(y, m - 1, d + s * 7 + i));
      out.push(dt.toISOString().slice(0, 10));
    }
  }
  return out;
}

function semanaDeFecha(fechaInicio: string | undefined, fecha: string): number | null {
  if (!fechaInicio) return null;
  const d1 = new Date(fechaInicio + "T00:00:00");
  const d2 = new Date(fecha + "T00:00:00");
  const dias = Math.floor((d2.getTime() - d1.getTime()) / 86400000);
  if (dias < 0) return null;
  const s = Math.floor(dias / 7) + 1;
  return s >= 1 && s <= 4 ? s : null;
}

function etiquetaDia(fecha: string, hoy: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const base = new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC", weekday: "short", day: "numeric", month: "short",
  }).format(dt).replace(/\./g, "");
  const [hy, hm, hd] = hoy.split("-").map(Number);
  const diff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(hy, hm - 1, hd)) / 86400000);
  const tag = diff === 0 ? " · Hoy" : diff === -1 ? " · Ayer" : diff === 1 ? " · Mañana" : "";
  return base + tag;
}

function CoachApp({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"lista" | "resumen">("lista");
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmSem, setConfirmSem] = useState<number | null>(null);
  const [cambiando, setCambiando] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const hoy = tijuanaHoy();

  const loadCfg = () => rpc<Cfg[]>("get_config_publica", {}).then((r) => setCfg(r[0]));
  useEffect(() => { loadCfg(); }, []);

  if (!cfg) return <SkeletonScreen />;

  const estado = estadoCurso(cfg.fecha_inicio, hoy);
  const desalineada = estado.tipo === "en_curso" && estado.semanaReal !== cfg.semana_activa;

  const confirmarCambio = async () => {
    if (confirmSem == null) return;
    setCambiando(true);
    try {
      await rpc("cambiar_semana", { p_pin: pin, p_semana: confirmSem });
      toast.success(`Semana ${confirmSem} activa`);
      setConfirmSem(null);
      setSheetOpen(false);
      await loadCfg();
      setReloadKey((k) => k + 1);
    } catch (e) { toast.error(String(e)); }
    finally { setCambiando(false); }
  };

  const banner = estado.tipo === "antes"
    ? `El curso inicia el ${estado.inicioTexto}`
    : desalineada
    ? `⚠ Semana activa: ${cfg.semana_activa} · Semana real de hoy: ${estado.tipo === "en_curso" ? estado.semanaReal : ""} · Ajusta si es necesario`
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo variant="mark" size={28} />
          <button onClick={() => setSheetOpen(true)} className="text-left active:opacity-70 transition-opacity">
            <div className="font-display text-sm capitalize flex items-center gap-1">
              {cfg.mes_activo} · Semana {cfg.semana_activa}
              <span className="text-gold text-xs">▾</span>
            </div>
            <div className="text-xs text-muted-foreground">Coach · toca para cambiar</div>
          </button>
        </div>
        <button onClick={onLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Salir</button>
      </header>

      {banner && (
        <div className="animate-fade-in">
          <div className="h-[2px] w-full bg-gold" />
          <div className="px-4 py-2 text-[11px] text-gold/90 bg-gold/5">
            {banner}
          </div>
        </div>
      )}


      <div className="animate-fade-in" key={reloadKey}>
        {tab === "lista" && <ListaDia pin={pin} mes={cfg.mes_activo} semana={cfg.semana_activa} fecha={hoy} />}
        {tab === "resumen" && <ResumenTab pin={pin} mes={cfg.mes_activo} fecha={hoy} />}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-white/5 grid grid-cols-2 z-20">
        {(["lista", "resumen"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`h-16 text-sm font-medium transition-colors ${tab === t ? "text-gold" : "text-muted-foreground"}`}>
            {t === "lista" ? "Lista" : "Resumen"}
          </button>
        ))}
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-30 flex items-end" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/60 animate-fade-in" />
          <div onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-surface border-t border-white/10 rounded-t-3xl p-5 pb-8 animate-scale-in">
            <div className="mx-auto w-10 h-1 rounded-full bg-white/20 mb-4" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground text-center mb-4">Semana activa</div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((s) => {
                const activa = cfg.semana_activa === s;
                return (
                  <button key={s} onClick={() => !activa && setConfirmSem(s)}
                    className={`w-full flex items-center gap-3 rounded-xl p-4 text-left transition-all active:scale-[0.98] ${
                      activa ? "border border-gold bg-gold/10" : "border border-white/10 bg-background"
                    }`}>
                    <span className={`font-display text-lg w-24 ${activa ? "text-gold" : ""}`}>Semana {s}</span>
                    <span className="text-sm text-muted-foreground flex-1">{NOMBRES_SEMANA[s]}</span>
                    {activa && <span className="text-gold text-xs">● activa</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSheetOpen(false)}
              className="mt-5 w-full h-12 rounded-xl border border-white/10 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {confirmSem !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6" onClick={() => !cambiando && setConfirmSem(null)}>
          <div className="absolute inset-0 bg-black/70 animate-fade-in" />
          <div onClick={(e) => e.stopPropagation()}
            className="relative card-elevated rounded-2xl p-6 max-w-sm w-full animate-scale-in">
            <h3 className="font-display text-lg">¿Cambiar a Semana {confirmSem}?</h3>
            <p className="text-sm text-muted-foreground mt-2">Esto afecta todas las evaluaciones del día.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button disabled={cambiando} onClick={() => setConfirmSem(null)}
                className="h-12 rounded-xl border border-white/10 text-sm disabled:opacity-40">Cancelar</button>
              <button disabled={cambiando} onClick={confirmarCambio}
                className="h-12 rounded-xl bg-gold text-gold-foreground font-semibold text-sm disabled:opacity-40">
                {cambiando ? "..." : "Sí, cambiar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonScreen() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-2xl shimmer" />
      ))}
    </div>
  );
}

function ListaDia({ pin, mes, semana, fecha }: { pin: string; mes: string; semana: number; fecha: string }) {
  const [rows, setRows] = useState<EvalRow[] | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showTip, setShowTip] = useState(false);

  const load = async () => {
    const ev = await rpc<EvalRow[]>("listar_evaluaciones_dia", { p_pin: pin, p_grupo: null, p_mes: mes, p_fecha: fecha });
    setRows(ev);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pin, mes, fecha]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("stryk_coach_tip_seen")) setShowTip(true);
  }, []);
  const closeTip = () => { localStorage.setItem("stryk_coach_tip_seen", "1"); setShowTip(false); };

  const setAsistencia = async (j: EvalRow, valor: string) => {
    try {
      await rpc("registrar_asistencia", { p_pin: pin, p_jugador: j.jugador_id, p_fecha: fecha, p_semana: semana, p_asistencia: valor });
      setRows((rs) => rs?.map((r) => r.jugador_id === j.jugador_id ? { ...r, asistencia: valor } : r) ?? null);
    } catch (e) { toast.error(String(e)); }
  };

  if (!rows) return <SkeletonScreen />;
  const registrados = rows.filter((r) => r.asistencia).length;

  if (openIdx !== null) {
    return (
      <IndividualEval
        pin={pin} semana={semana} fecha={fecha} rows={rows} idx={openIdx}
        onClose={() => { load(); setOpenIdx(null); }}
        onNav={(d) => setOpenIdx((i) => (i === null ? 0 : Math.max(0, Math.min(rows.length - 1, i + d))))}
      />
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-3xl font-display text-gold">{registrados}</span>
        <span className="text-sm text-muted-foreground">de {rows.length} registrados</span>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => {
          const completoActitud = r.esfuerzo != null && r.aplicacion_tactica != null && r.trabajo_equipo != null && r.comunicacion != null;
          const dot = r.asistencia === "ausente" ? "bg-destructive"
            : completoActitud ? "bg-success"
            : r.asistencia ? "bg-warning"
            : "bg-white/20";
          const avg = completoActitud
            ? ((r.esfuerzo! + r.aplicacion_tactica! + r.trabajo_equipo! + r.comunicacion!) / 4).toFixed(1)
            : null;
          const tecEstado = "pendiente";

          return (
            <div key={r.jugador_id} className="card-elevated rounded-2xl p-4 relative">
              {i === 0 && showTip && (
                <div className="absolute -top-14 left-2 right-2 bg-gold text-gold-foreground text-xs px-3 py-2 rounded-lg shadow-lg animate-fade-in flex items-start justify-between gap-2">
                  <span>Toca <b>Evaluar →</b> para registrar todos los indicadores.</span>
                  <button onClick={closeTip} className="font-bold" aria-label="Cerrar">✕</button>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <button onClick={() => setOpenIdx(i)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot} transition-colors`} />
                  <span className="font-display text-lg truncate">{r.nombre}</span>
                </button>
                <button onClick={() => setOpenIdx(i)}
                  className="h-10 px-4 rounded-xl bg-gold text-gold-foreground font-semibold text-sm active:scale-95 transition-transform">
                  Evaluar →
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <AsistBtn active={r.asistencia === "puntual"} onClick={() => setAsistencia(r, "puntual")} color="success" label="✅ Puntual" />
                <AsistBtn active={r.asistencia === "tardanza"} onClick={() => setAsistencia(r, "tardanza")} color="warning" label="⏰ Tarde" />
                <AsistBtn active={r.asistencia === "ausente"} onClick={() => setAsistencia(r, "ausente")} color="destructive" label="❌ Ausente" />
              </div>
              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-3">
                <span>Actitud: <span className="text-foreground">{avg ? <>★ {avg}</> : "pendiente"}</span></span>
                <span className="opacity-40">·</span>
                <span>Técnica: <span className="text-foreground">{tecEstado}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AsistBtn({ active, onClick, color, label }: { active: boolean; onClick: () => void; color: string; label: string }) {
  const bg = active
    ? (color === "success" ? "bg-success text-black" : color === "warning" ? "bg-warning text-black" : "bg-destructive text-white")
    : "bg-background text-foreground border border-white/10";
  return (
    <button onClick={onClick} className={`h-12 rounded-xl text-sm font-medium active:scale-95 transition-transform ${bg}`}>
      {label}
    </button>
  );
}

type HistDiaria = { fecha: string; semana: number; asistencia: string | null; esfuerzo: number | null; aplicacion_tactica: number | null; trabajo_equipo: number | null; comunicacion: number | null; nota_coach: string | null };
type HistTecnica = { semana: number; indicador: string; valor: number };

function IndividualEval({
  pin, semana, fecha, rows, idx, onClose, onNav,
}: {
  pin: string; semana: number; fecha: string; rows: EvalRow[]; idx: number;
  onClose: () => void; onNav: (dir: number) => void;
}) {
  const r = rows[idx];
  const [vals, setVals] = useState({
    esfuerzo: r.esfuerzo ?? 0,
    aplicacion_tactica: r.aplicacion_tactica ?? 0,
    trabajo_equipo: r.trabajo_equipo ?? 0,
    comunicacion: r.comunicacion ?? 0,
    nota: r.nota_coach ?? "",
  });
  const tecIndicadores = TECNICAS_POR_SEMANA[semana] ?? [];
  const [tecVals, setTecVals] = useState<Record<string, number>>({});
  const [logros, setLogros] = useState<Logro[]>([]);
  const [historial, setHistorial] = useState<{ diarias: HistDiaria[]; tecnicas: HistTecnica[] } | null>(null);
  const [histOpen, setHistOpen] = useState(false);
  const logrosSemana = LOGROS_POR_SEMANA[semana - 1]?.logros ?? [];

  useEffect(() => {
    rpc<Logro[]>("listar_logros_coach", { p_pin: pin, p_jugador: r.jugador_id }).then(setLogros).catch(() => {});
    rpc<{ diarias: HistDiaria[]; tecnicas: HistTecnica[] }>("historial_jugador_coach", { p_pin: pin, p_jugador: r.jugador_id })
      .then((h) => {
        setHistorial(h);
        // precarga valores técnicos ya registrados para esta semana
        const yaEnSemana: Record<string, number> = {};
        h.tecnicas.filter((t) => t.semana === semana).forEach((t) => { yaEnSemana[t.indicador] = t.valor; });
        setTecVals(yaEnSemana);
      })
      .catch(() => {});
  }, [pin, r.jugador_id, semana]);

  const s1TecMap = useMemo(() => {
    const m: Record<string, number> = {};
    historial?.tecnicas.filter((t) => t.semana === 1).forEach((t) => { m[t.indicador] = t.valor; });
    return m;
  }, [historial]);

  const semanasPrevias = useMemo(() => {
    if (!historial) return [] as number[];
    const set = new Set<number>();
    historial.diarias.filter((d) => d.semana < semana).forEach((d) => set.add(d.semana));
    historial.tecnicas.filter((t) => t.semana < semana).forEach((t) => set.add(t.semana));
    return Array.from(set).sort();
  }, [historial, semana]);

  const dirty = useMemo(() => JSON.stringify(vals) !== JSON.stringify({
    esfuerzo: r.esfuerzo ?? 0, aplicacion_tactica: r.aplicacion_tactica ?? 0,
    trabajo_equipo: r.trabajo_equipo ?? 0, comunicacion: r.comunicacion ?? 0, nota: r.nota_coach ?? "",
  }), [vals, r]);

  const guardarActitud = async (silencioso = false) => {
    if (vals.esfuerzo === 0 || vals.aplicacion_tactica === 0 || vals.trabajo_equipo === 0 || vals.comunicacion === 0) {
      if (!silencioso) toast.error("Califica los 4 indicadores de actitud");
      return false;
    }
    await rpc("guardar_evaluacion_diaria", {
      p_pin: pin, p_jugador: r.jugador_id, p_fecha: fecha, p_semana: semana,
      p_esfuerzo: vals.esfuerzo, p_tactica: vals.aplicacion_tactica,
      p_equipo: vals.trabajo_equipo, p_comunicacion: vals.comunicacion, p_nota: vals.nota,
    });
    return true;
  };

  const guardarTodo = async () => {
    const ok = await guardarActitud();
    if (!ok) return;
    for (const ind of tecIndicadores) {
      const v = tecVals[ind];
      if (v && v >= 1) {
        await rpc("guardar_evaluacion_tecnica", { p_pin: pin, p_jugador: r.jugador_id, p_semana: semana, p_indicador: ind, p_valor: v, p_nota: null, p_fecha: fecha });
      }
    }
    toast.success("Evaluación completa guardada");
    onClose();
  };

  const navegar = async (dir: number) => {
    if (dirty && vals.esfuerzo && vals.aplicacion_tactica && vals.trabajo_equipo && vals.comunicacion) {
      try { await guardarActitud(true); } catch (e) { toast.error(String(e)); }
    }
    onNav(dir);
  };

  const toggleLogro = async (codigo: string, valor: boolean) => {
    try {
      await rpc("toggle_logro_coach", { p_pin: pin, p_jugador: r.jugador_id, p_codigo: codigo, p_valor: valor });
      setLogros((ls) => ls.map((l) => l.logro_codigo === codigo ? { ...l, desbloqueado: valor } : l));
      if (valor && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    } catch (e) { toast.error(String(e)); }
  };

  const chipTec = semana === 1
    ? { txt: "📊 BASELINE — Punto de partida", cls: "bg-blue-500/15 text-blue-300 border-blue-500/40" }
    : semana === 4
      ? { txt: "📊 COMPARATIVO FINAL — Se compara con S1", cls: "bg-gold/15 text-gold border-gold/40" }
      : { txt: "Evaluación intermedia", cls: "bg-white/5 text-muted-foreground border-white/10" };

  return (
    <div className="p-4 pb-32 max-w-lg mx-auto animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navegar(-1)} disabled={idx === 0} className="text-sm disabled:opacity-30">← Anterior</button>
        <button onClick={onClose} className="text-sm text-muted-foreground">← Jugadores</button>
        <button onClick={() => navegar(1)} disabled={idx === rows.length - 1} className="text-sm disabled:opacity-30">Siguiente →</button>
      </div>
      <h2 className="text-3xl font-display">{r.nombre}</h2>

      {/* HISTORIAL */}
      {semanasPrevias.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-surface overflow-hidden">
          <button onClick={() => setHistOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm">
            <span>📈 Ver historial (Semana{semanasPrevias.length > 1 ? "s" : ""} {semanasPrevias.join(", ")})</span>
            <span className="text-muted-foreground">{histOpen ? "▴" : "▾"}</span>
          </button>
          {histOpen && historial && (
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 animate-fade-in">
              {semanasPrevias.map((sp) => {
                const dsem = historial.diarias.filter((d) => d.semana === sp && d.asistencia !== "ausente");
                const avg = (k: keyof HistDiaria) => {
                  const vs = dsem.map((d) => d[k]).filter((v): v is number => typeof v === "number");
                  return vs.length ? (vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1) : "—";
                };
                const tsem = historial.tecnicas.filter((t) => t.semana === sp);
                return (
                  <div key={sp} className="text-xs">
                    <div className="uppercase tracking-widest text-muted-foreground mb-1">Semana {sp}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>Esfuerzo: <span className="text-foreground">{avg("esfuerzo")}</span></div>
                      <div>Táctica: <span className="text-foreground">{avg("aplicacion_tactica")}</span></div>
                      <div>Equipo: <span className="text-foreground">{avg("trabajo_equipo")}</span></div>
                      <div>Comunicación: <span className="text-foreground">{avg("comunicacion")}</span></div>
                    </div>
                    {tsem.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                        {tsem.map((t) => (
                          <div key={t.indicador}>{INDICADORES_TECNICOS[t.indicador]}: <span className="text-foreground">{t.valor}/5</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ACTITUD */}
      <SectionTitle>Actitud (diario)</SectionTitle>
      <div className="space-y-5">
        {INDICADORES_ACTITUD.map((ind) => (
          <div key={ind.key}>
            <div className="text-sm font-medium mb-2">{ind.label}</div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setVals((v) => ({ ...v, [ind.key]: n }))}
                  className={`h-14 rounded-xl font-display text-lg active:scale-95 transition-all ${
                    (vals as unknown as Record<string, number>)[ind.key] === n
                      ? "bg-gold text-gold-foreground gold-glow"
                      : "bg-surface border border-white/10"
                  }`}>{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* TÉCNICA */}
      <SectionTitle>Técnica (semana {semana})</SectionTitle>
      <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium mb-4 ${chipTec.cls}`}>
        {chipTec.txt}
      </div>
      <div className="space-y-5">
        {tecIndicadores.map((ind) => {
          const s1 = s1TecMap[ind];
          const cur = tecVals[ind];
          let deltaEl: React.ReactNode = null;
          if (semana > 1 && s1 != null) {
            if (cur && cur >= 1) {
              const diff = cur - s1;
              const cls = diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-warning";
              const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "=";
              deltaEl = <span className={`ml-2 ${cls}`}>(S1: {s1} → {cur} {arrow})</span>;
            } else {
              deltaEl = <span className="ml-2 text-muted-foreground">(S1: {s1})</span>;
            }
          }
          return (
            <div key={ind}>
              <div className="text-sm font-medium mb-2">
                {INDICADORES_TECNICOS[ind]}
                {deltaEl}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setTecVals((v) => ({ ...v, [ind]: n }))}
                    className={`h-14 rounded-xl font-display text-lg active:scale-95 transition-all ${
                      tecVals[ind] === n ? "bg-gold text-gold-foreground gold-glow" : "bg-surface border border-white/10"
                    }`}>{n}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* LOGROS */}
      <SectionTitle>Logros de la semana</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {logrosSemana.map((l) => {
          const on = logros.find((x) => x.logro_codigo === l.codigo)?.desbloqueado ?? false;
          return (
            <button key={l.codigo} onClick={() => toggleLogro(l.codigo, !on)}
              className={`text-left rounded-xl p-3 border transition-all active:scale-95 ${
                on ? "bg-gold text-gold-foreground border-gold gold-glow" : "bg-transparent border-white/10 text-muted-foreground"
              }`}>
              <div className="text-base">{on ? "🏅" : "🔒"}</div>
              <div className="mt-1 text-xs font-semibold leading-tight">{l.nombre}</div>
            </button>
          );
        })}
      </div>

      {/* NOTA */}
      <div className="mt-6">
        <div className="text-sm font-medium mb-2">Nota rápida (opcional)</div>
        <textarea value={vals.nota} onChange={(e) => setVals((v) => ({ ...v, nota: e.target.value }))}
          className="w-full h-20 p-3 rounded-xl bg-surface border border-white/10 text-sm" />
      </div>

      {/* GUARDAR sticky */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-20">
        <div className="max-w-lg mx-auto">
          <button onClick={guardarTodo}
            className="w-full h-14 rounded-xl bg-gold text-gold-foreground font-display text-lg gold-glow active:scale-95 transition-transform">
            GUARDAR TODO
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 mb-4">
      <div className="w-10 h-[3px] bg-gold mb-2" />
      <h3 className="font-display text-xs uppercase" style={{ letterSpacing: "0.15em" }}>{children}</h3>
    </div>
  );
}

function ResumenTab({ pin, mes, fecha }: { pin: string; mes: string; fecha: string }) {
  const [rows, setRows] = useState<EvalRow[] | null>(null);
  useEffect(() => {
    rpc<EvalRow[]>("listar_evaluaciones_dia", { p_pin: pin, p_grupo: null, p_mes: mes, p_fecha: fecha }).then(setRows);
  }, [pin, mes, fecha]);
  if (!rows) return <SkeletonScreen />;

  const pendientes = rows.filter((r) => r.asistencia && r.asistencia !== "ausente" && (r.esfuerzo == null || r.aplicacion_tactica == null));
  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h2 className="font-display text-lg mb-3">Resumen del día</h2>
      {pendientes.length > 0 && (
        <div className="mb-4 rounded-xl bg-warning/20 border border-warning/40 p-3 text-sm">
          ⚠ Faltan indicadores: {pendientes.map((p) => p.nombre).join(", ")}
        </div>
      )}
      <div className="card-elevated rounded-2xl overflow-hidden">
        {rows.map((r) => {
          const completo = r.esfuerzo != null && r.aplicacion_tactica != null && r.trabajo_equipo != null && r.comunicacion != null;
          return (
            <div key={r.jugador_id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
              <span>{r.nombre}</span>
              <span className="text-sm">{r.asistencia ?? "—"} · {completo ? "✓" : "✗"}</span>
            </div>
          );
        })}
      </div>
      {pendientes.length === 0 && rows.every((r) => r.asistencia) && (
        <div className="mt-6 rounded-xl bg-success/20 border border-success/40 p-4 text-center font-display">
          Día completo ✓
        </div>
      )}
    </div>
  );
}
