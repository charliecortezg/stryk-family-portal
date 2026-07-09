import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import {
  INDICADORES_ACTITUD,
  INDICADORES_TECNICOS,
  TECNICAS_POR_SEMANA,
  cerrarCoach,
  fechaLarga,
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

type Cfg = { mes_activo: string; semana_activa: number };

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
      if (!ok) {
        toast.error("PIN incorrecto");
        setVal("");
      } else {
        guardarPinCoach(pin);
        onOk(pin);
      }
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
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
          <div
            key={i}
            className="w-14 h-16 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-3xl font-display"
          >
            {val[i] ? "•" : ""}
          </div>
        ))}
      </div>
      <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-xs">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map((k, i) => (
          <button
            key={i}
            disabled={!k || loading}
            onClick={() => k && press(k)}
            className="h-16 rounded-xl bg-surface border border-white/10 text-2xl font-display active:bg-gold active:text-gold-foreground disabled:opacity-30"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function CoachApp({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"lista" | "tecnica" | "resumen">("lista");
  const [grupo, setGrupo] = useState<"A" | "B" | null>(null);
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const hoy = tijuanaHoy();

  useEffect(() => {
    rpc<Cfg[]>("get_config_publica", {}).then((r) => setCfg(r[0]));
  }, []);

  if (!cfg) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Cargando…</div>;

  if (!grupo)
    return (
      <div className="min-h-screen bg-background flex flex-col p-5">
        <header className="flex items-center justify-between">
          <Logo variant="mark" size={36} />
          <button onClick={onLogout} className="text-sm text-muted-foreground">Salir</button>
        </header>
        <div className="flex-1 flex flex-col justify-center gap-4 max-w-md mx-auto w-full">
          <h1 className="text-2xl font-display text-center">Selecciona un grupo</h1>
          <button
            onClick={() => setGrupo("A")}
            className="h-32 rounded-2xl bg-surface border border-white/10 hover:border-gold text-2xl font-display transition"
          >
            GRUPO A
            <div className="text-sm font-normal text-muted-foreground mt-1">8-9 años</div>
          </button>
          <button
            onClick={() => setGrupo("B")}
            className="h-32 rounded-2xl bg-surface border border-white/10 hover:border-gold text-2xl font-display transition"
          >
            GRUPO B
            <div className="text-sm font-normal text-muted-foreground mt-1">10-11 años</div>
          </button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {fechaLarga(hoy)} · Semana {cfg.semana_activa} · {cfg.mes_activo}
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo variant="mark" size={28} />
          <div>
            <div className="font-display text-sm">Grupo {grupo} · Sem {cfg.semana_activa}</div>
            <div className="text-xs text-muted-foreground">{cfg.mes_activo}</div>
          </div>
        </div>
        <button onClick={() => setGrupo(null)} className="text-sm text-muted-foreground">Cambiar</button>
      </header>

      {tab === "lista" && <ListaDia pin={pin} grupo={grupo} mes={cfg.mes_activo} semana={cfg.semana_activa} fecha={hoy} />}
      {tab === "tecnica" && <TecnicaTab pin={pin} grupo={grupo} mes={cfg.mes_activo} semana={cfg.semana_activa} fecha={hoy} />}
      {tab === "resumen" && <ResumenTab pin={pin} grupo={grupo} mes={cfg.mes_activo} fecha={hoy} />}

      <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-white/5 grid grid-cols-3 z-20">
        {(["lista", "tecnica", "resumen"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-16 text-sm font-medium ${tab === t ? "text-gold" : "text-muted-foreground"}`}
          >
            {t === "lista" ? "Lista" : t === "tecnica" ? "Técnica" : "Resumen"}
          </button>
        ))}
      </nav>
    </div>
  );
}

function ListaDia({ pin, grupo, mes, semana, fecha }: { pin: string; grupo: string; mes: string; semana: number; fecha: string }) {
  const [rows, setRows] = useState<EvalRow[] | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const load = () => rpc<EvalRow[]>("listar_evaluaciones_dia", { p_pin: pin, p_grupo: grupo, p_mes: mes, p_fecha: fecha }).then(setRows);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pin, grupo, mes, fecha]);

  const setAsistencia = async (j: EvalRow, valor: string) => {
    try {
      await rpc("registrar_asistencia", { p_pin: pin, p_jugador: j.jugador_id, p_fecha: fecha, p_semana: semana, p_asistencia: valor });
      setRows((rs) => rs?.map((r) => r.jugador_id === j.jugador_id ? { ...r, asistencia: valor } : r) ?? null);
    } catch (e) { toast.error(String(e)); }
  };

  if (!rows) return <div className="p-6 text-muted-foreground">Cargando…</div>;
  const registrados = rows.filter((r) => r.asistencia).length;

  if (openIdx !== null)
    return (
      <IndividualEval
        pin={pin}
        semana={semana}
        fecha={fecha}
        rows={rows}
        idx={openIdx}
        onClose={() => { load(); setOpenIdx(null); }}
        onNav={(d) => setOpenIdx((i) => (i === null ? 0 : Math.max(0, Math.min(rows.length - 1, i + d))))}
      />
    );

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="text-sm text-muted-foreground mb-3">Registrados: {registrados}/{rows.length}</div>
      <div className="space-y-3">
        {rows.map((r, i) => {
          const completo = r.esfuerzo != null && r.aplicacion_tactica != null && r.trabajo_equipo != null && r.comunicacion != null;
          return (
            <div key={r.jugador_id} className="bg-surface rounded-2xl p-4 border border-white/5">
              <button onClick={() => setOpenIdx(i)} className="w-full text-left flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    completo ? "bg-success" : r.asistencia ? "bg-warning" : "bg-transparent border border-white/20"
                  }`}
                />
                <span className="font-display text-lg">{r.nombre}</span>
              </button>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <AsistBtn active={r.asistencia === "puntual"} onClick={() => setAsistencia(r, "puntual")} color="success" label="✅ Puntual" />
                <AsistBtn active={r.asistencia === "tardanza"} onClick={() => setAsistencia(r, "tardanza")} color="warning" label="⏰ Tarde" />
                <AsistBtn active={r.asistencia === "ausente"} onClick={() => setAsistencia(r, "ausente")} color="destructive" label="❌ Ausente" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AsistBtn({ active, onClick, color, label }: { active: boolean; onClick: () => void; color: string; label: string }) {
  const bg = active ? (color === "success" ? "bg-success text-black" : color === "warning" ? "bg-warning text-black" : "bg-destructive text-white") : "bg-background text-foreground border border-white/10";
  return (
    <button onClick={onClick} className={`h-12 rounded-xl text-sm font-medium ${bg}`}>
      {label}
    </button>
  );
}

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
  const dirty = useMemo(() => JSON.stringify(vals) !== JSON.stringify({
    esfuerzo: r.esfuerzo ?? 0, aplicacion_tactica: r.aplicacion_tactica ?? 0,
    trabajo_equipo: r.trabajo_equipo ?? 0, comunicacion: r.comunicacion ?? 0, nota: r.nota_coach ?? "",
  }), [vals, r]);

  const guardar = async () => {
    if (vals.esfuerzo === 0 || vals.aplicacion_tactica === 0 || vals.trabajo_equipo === 0 || vals.comunicacion === 0) {
      toast.error("Califica los 4 indicadores"); return false;
    }
    await rpc("guardar_evaluacion_diaria", {
      p_pin: pin, p_jugador: r.jugador_id, p_fecha: fecha, p_semana: semana,
      p_esfuerzo: vals.esfuerzo, p_tactica: vals.aplicacion_tactica,
      p_equipo: vals.trabajo_equipo, p_comunicacion: vals.comunicacion, p_nota: vals.nota,
    });
    toast.success("Guardado");
    return true;
  };

  const navegar = async (dir: number) => {
    if (dirty && vals.esfuerzo && vals.aplicacion_tactica && vals.trabajo_equipo && vals.comunicacion) {
      try { await guardar(); } catch (e) { toast.error(String(e)); }
    }
    onNav(dir);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navegar(-1)} disabled={idx === 0} className="text-sm disabled:opacity-30">← Anterior</button>
        <button onClick={onClose} className="text-sm text-muted-foreground">Cerrar</button>
        <button onClick={() => navegar(1)} disabled={idx === rows.length - 1} className="text-sm disabled:opacity-30">Siguiente →</button>
      </div>
      <h2 className="text-2xl font-display">{r.nombre}</h2>
      <div className="mt-6 space-y-5">
        {INDICADORES_ACTITUD.map((ind) => (
          <div key={ind.key}>
            <div className="text-sm font-medium mb-2">{ind.label}</div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setVals((v) => ({ ...v, [ind.key]: n }))}
                  className={`h-14 rounded-xl font-display text-lg ${
                    (vals as unknown as Record<string, number>)[ind.key] === n
                      ? "bg-gold text-gold-foreground"
                      : "bg-surface border border-white/10"
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="text-sm font-medium mb-2">Nota rápida (opcional)</div>
          <textarea
            value={vals.nota}
            onChange={(e) => setVals((v) => ({ ...v, nota: e.target.value }))}
            className="w-full h-20 p-3 rounded-xl bg-surface border border-white/10 text-sm"
          />
        </div>
        <button onClick={() => guardar().catch((e) => toast.error(String(e)))} className="w-full h-14 rounded-xl bg-gold text-gold-foreground font-display text-lg">
          GUARDAR
        </button>
      </div>
    </div>
  );
}

function TecnicaTab({ pin, grupo, mes, semana, fecha }: { pin: string; grupo: string; mes: string; semana: number; fecha: string }) {
  const [players, setPlayers] = useState<{ id: string; nombre: string }[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const indicadores = TECNICAS_POR_SEMANA[semana] ?? [];

  useEffect(() => {
    rpc<{ id: string; nombre: string }[]>("listar_jugadores", { p_pin: pin, p_grupo: grupo, p_mes: mes, p_solo_activos: true }).then(setPlayers);
  }, [pin, grupo, mes]);

  if (semana === 4) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center text-muted-foreground">
        Esta semana no hay evaluación técnica — el foco es colectivo. Completa la evaluación final el jueves.
      </div>
    );
  }

  if (!sel) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-2">
        <h2 className="font-display text-lg mb-3">Selecciona un jugador</h2>
        {players.map((p) => (
          <button key={p.id} onClick={() => setSel(p.id)} className="w-full h-14 rounded-xl bg-surface border border-white/10 text-left px-4 font-display">
            {p.nombre}
          </button>
        ))}
      </div>
    );
  }

  const jug = players.find((p) => p.id === sel)!;
  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => setSel(null)} className="text-sm text-muted-foreground">← Jugadores</button>
      <h2 className="text-2xl font-display mt-2">{jug.nombre}</h2>
      <div className="mt-6 space-y-5">
        {indicadores.map((ind) => (
          <TecnicaRow key={ind} pin={pin} jugador={sel} semana={semana} indicador={ind} fecha={fecha} />
        ))}
      </div>
    </div>
  );
}

function TecnicaRow({ pin, jugador, semana, indicador, fecha }: { pin: string; jugador: string; semana: number; indicador: string; fecha: string }) {
  const [val, setVal] = useState<number>(0);
  const save = async (n: number) => {
    setVal(n);
    try {
      await rpc("guardar_evaluacion_tecnica", { p_pin: pin, p_jugador: jugador, p_semana: semana, p_indicador: indicador, p_valor: n, p_nota: null, p_fecha: fecha });
      toast.success("Guardado");
    } catch (e) { toast.error(String(e)); }
  };
  return (
    <div>
      <div className="text-sm font-medium mb-2">{INDICADORES_TECNICOS[indicador]}</div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => save(n)} className={`h-14 rounded-xl font-display text-lg ${val === n ? "bg-gold text-gold-foreground" : "bg-surface border border-white/10"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResumenTab({ pin, grupo, mes, fecha }: { pin: string; grupo: string; mes: string; fecha: string }) {
  const [rows, setRows] = useState<EvalRow[] | null>(null);
  useEffect(() => {
    rpc<EvalRow[]>("listar_evaluaciones_dia", { p_pin: pin, p_grupo: grupo, p_mes: mes, p_fecha: fecha }).then(setRows);
  }, [pin, grupo, mes, fecha]);
  if (!rows) return <div className="p-6 text-muted-foreground">Cargando…</div>;

  const pendientes = rows.filter((r) => r.asistencia && r.asistencia !== "ausente" && (r.esfuerzo == null || r.aplicacion_tactica == null));
  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="font-display text-lg mb-3">Resumen del día</h2>
      {pendientes.length > 0 && (
        <div className="mb-4 rounded-xl bg-warning/20 border border-warning/40 p-3 text-sm">
          ⚠ Faltan indicadores: {pendientes.map((p) => p.nombre).join(", ")}
        </div>
      )}
      <div className="rounded-2xl bg-surface border border-white/5 overflow-hidden">
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
