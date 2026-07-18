import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import {
  INDICADORES_ACTITUD,
  LOGROS_POR_SEMANA,
  MESES,
  cerrarAdmin,
  fechaLarga,
  fechasDeSemana,
  guardarPassAdmin,
  obtenerPassAdmin,
  rpc,
} from "@/lib/stryk";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — STRYK" }, { name: "robots", content: "noindex" }] }),
  ssr: false,
  component: AdminPage,
});

type Jugador = { id: string; nombre: string; grupo: string; mes: string; codigo_familia: string; activo: boolean };
type ConfigRow = { pin_coach: string; password_admin: string; mes_activo: string; semana_activa: number };

function AdminPage() {
  const [pass, setPass] = useState<string | null>(null);
  useEffect(() => setPass(obtenerPassAdmin()), []);
  if (!pass) return <AdminLogin onOk={(p) => setPass(p)} />;
  return <AdminShell pass={pass} onLogout={() => { cerrarAdmin(); setPass(null); }} />;
}

function AdminLogin({ onOk }: { onOk: (p: string) => void }) {
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await rpc<boolean>("verificar_admin", { p_pass: val });
      if (!ok) toast.error("Contraseña incorrecta");
      else { guardarPassAdmin(val); onOk(val); }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-surface rounded-2xl p-6 border border-white/5">
        <Logo variant="full" size={48} />
        <h1 className="mt-6 text-xl font-display">Panel de administración</h1>
        <label className="mt-6 block text-xs uppercase tracking-widest text-muted-foreground">Contraseña</label>
        <input
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-white/10 focus:border-gold focus:outline-none"
        />
        <button disabled={loading} className="mt-4 w-full h-12 rounded-xl bg-gold text-gold-foreground font-semibold">
          {loading ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

type Section = "jugadores" | "semaforo" | "logros" | "reportes" | "config";

function AdminShell({ pass, onLogout }: { pass: string; onLogout: () => void }) {
  const [sec, setSec] = useState<Section>("jugadores");
  const [open, setOpen] = useState(false);

  const items: { key: Section; label: string; icon: string }[] = [
    { key: "jugadores", label: "Jugadores", icon: "👥" },
    { key: "semaforo", label: "Semáforo", icon: "🚦" },
    { key: "logros", label: "Logros", icon: "🏅" },
    { key: "reportes", label: "Reportes", icon: "📄" },
    { key: "config", label: "Configuración", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-surface border-r border-white/5 p-4 flex flex-col z-30 transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Logo variant="full" size={40} />
        <nav className="mt-8 flex-1 space-y-1">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => { setSec(it.key); setOpen(false); }}
              className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 ${sec === it.key ? "bg-gold text-gold-foreground" : "hover:bg-white/5"}`}
            >
              <span>{it.icon}</span><span className="font-medium">{it.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="mt-auto text-sm text-muted-foreground hover:text-foreground">Cerrar sesión</button>
      </aside>

      <main className="flex-1 min-w-0 lg:ml-0">
        <header className="lg:hidden sticky top-0 bg-background border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(!open)} className="text-2xl">☰</button>
          <Logo variant="mark" size={28} />
        </header>
        <div className="p-4 sm:p-8 max-w-6xl">
          {sec === "jugadores" && <SecJugadores pass={pass} />}
          {sec === "semaforo" && <SecSemaforo pass={pass} />}
          {sec === "logros" && <SecLogros pass={pass} />}
          {sec === "reportes" && <SecReportes pass={pass} />}
          {sec === "config" && <SecConfig pass={pass} />}
        </div>
      </main>
    </div>
  );
}

// ---------------- Jugadores ----------------
function SecJugadores({ pass }: { pass: string }) {
  const [list, setList] = useState<Jugador[] | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = () => rpc<Jugador[]>("listar_jugadores", { p_pin: pass }).then(setList);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const copy = (txt: string, msg = "Copiado") => { navigator.clipboard.writeText(txt); toast.success(msg); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display">Jugadores</h1>
        <button onClick={() => setShowNew(true)} className="h-11 px-4 rounded-xl bg-gold text-gold-foreground font-semibold">+ Agregar</button>
      </div>

      {!list ? <div className="text-muted-foreground">Cargando…</div> : (
        <div className="rounded-2xl bg-surface border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background/50 text-left text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Mes</th><th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Estado</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((j) => (
                <tr key={j.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium">{j.nombre}</td>
                  <td className="px-4 py-3 capitalize">{j.mes}</td>
                  <td className="px-4 py-3 font-mono text-gold">{j.codigo_familia}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={j.activo} onChange={async (e) => {
                        await rpc("set_activo", { p_pass: pass, p_jugador: j.id, p_activo: e.target.checked });
                        load();
                      }} />
                      <span>{j.activo ? "Activo" : "Inactivo"}</span>
                    </label>
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2 justify-end">
                    <button onClick={() => copy(j.codigo_familia, "Código copiado")} className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10">Copiar código</button>
                    <button onClick={() => copy(`${window.location.origin}/progreso/${j.codigo_familia}`, "Link copiado")} className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10">Copiar link</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NuevoJugadorModal pass={pass} onClose={() => setShowNew(false)} onSaved={() => { load(); setShowNew(false); }} />
      )}
    </div>
  );
}

function NuevoJugadorModal({ pass, onClose, onSaved }: { pass: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ nombre: "", mes: "julio" });
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await rpc("crear_jugador", { p_pass: pass, p_nombre: f.nombre, p_grupo: "V26", p_mes: f.mes });
      toast.success("Jugador creado");
      onSaved();
    } catch (e) { toast.error(String(e)); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-surface rounded-2xl p-6 w-full max-w-md border border-white/10">
        <h2 className="text-lg font-display">Nuevo jugador</h2>
        <label className="block mt-4 text-xs uppercase tracking-widest text-muted-foreground">Nombre</label>
        <input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-white/10" />
        <div className="mt-4">
          <label className="block text-xs uppercase tracking-widest text-muted-foreground">Mes</label>
          <select value={f.mes} onChange={(e) => setF({ ...f, mes: e.target.value })} className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-white/10 capitalize">
            {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="mt-6 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl bg-white/5">Cancelar</button>
          <button disabled={loading} className="h-11 px-4 rounded-xl bg-gold text-gold-foreground font-semibold">{loading ? "Creando…" : "Crear"}</button>
        </div>
      </form>
    </div>
  );
}

// ---------------- Semaforo ----------------
function SecSemaforo({ pass }: { pass: string }) {
  const [f, setF] = useState({ mes: "julio", semana: 1 });
  const [rows, setRows] = useState<{ jugador_id: string; nombre: string; fecha: string | null; asistencia: string | null; completo: boolean }[]>([]);

  useEffect(() => {
    rpc<typeof rows>("semaforo", { p_pass: pass, p_grupo: null, p_mes: f.mes, p_semana: f.semana }).then(setRows);
  }, [pass, f]);

  const jugadores = useMemo(() => {
    const map = new Map<string, { nombre: string; dias: Record<string, { asistencia: string | null; completo: boolean }> }>();
    for (const r of rows) {
      if (!map.has(r.jugador_id)) map.set(r.jugador_id, { nombre: r.nombre, dias: {} });
      if (r.fecha) map.get(r.jugador_id)!.dias[r.fecha] = { asistencia: r.asistencia, completo: r.completo };
    }
    return Array.from(map.entries()).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));
  }, [rows]);

  const fechas = fechasDeSemana(f.mes, f.semana);
  const dias = ["L", "M", "X", "J", "V"];

  const color = (d?: { asistencia: string | null; completo: boolean }) => {
    if (!d || !d.asistencia) return "bg-destructive/40";
    if (d.asistencia === "ausente") return "bg-muted";
    if (d.completo) return "bg-success";
    return "bg-warning";
  };

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">Semáforo de registro</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={f.mes} onChange={(e) => setF({ ...f, mes: e.target.value })} className="h-10 px-3 rounded-xl bg-surface border border-white/10 capitalize">
          {MESES.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={f.semana} onChange={(e) => setF({ ...f, semana: Number(e.target.value) })} className="h-10 px-3 rounded-xl bg-surface border border-white/10">
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Semana {n}</option>)}
        </select>
      </div>
      <div className="rounded-2xl bg-surface border border-white/5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/50">
            <tr>
              <th className="text-left px-4 py-3">Jugador</th>
              {dias.map((d) => <th key={d} className="px-3 py-3">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {jugadores.map(([id, j]) => (
              <tr key={id} className="border-t border-white/5">
                <td className="px-4 py-3 font-medium">{j.nombre}</td>
                {fechas.map((fecha) => (
                  <td key={fecha} className="px-3 py-3">
                    <div className={`w-8 h-8 mx-auto rounded-md ${color(j.dias[fecha])}`} title={fecha} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span><span className="inline-block w-3 h-3 rounded bg-success mr-1" />Completo</span>
        <span><span className="inline-block w-3 h-3 rounded bg-warning mr-1" />Solo asistencia</span>
        <span><span className="inline-block w-3 h-3 rounded bg-destructive/40 mr-1" />Sin registro</span>
        <span><span className="inline-block w-3 h-3 rounded bg-muted mr-1" />Ausente</span>
      </div>
    </div>
  );
}

// ---------------- Logros ----------------
function SecLogros({ pass }: { pass: string }) {
  const [players, setPlayers] = useState<Jugador[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [logros, setLogros] = useState<{ logro_codigo: string; desbloqueado: boolean }[]>([]);

  useEffect(() => { rpc<Jugador[]>("listar_jugadores", { p_pin: pass }).then(setPlayers); }, [pass]);
  const loadLogros = (id: string) => rpc<{ logro_codigo: string; desbloqueado: boolean }[]>("listar_logros", { p_pin: pass, p_jugador: id }).then(setLogros);
  useEffect(() => { if (sel) loadLogros(sel); }, [sel]); // eslint-disable-line

  const toggle = async (c: string, v: boolean) => {
    if (!sel) return;
    await rpc("toggle_logro", { p_pass: pass, p_jugador: sel, p_codigo: c, p_valor: v });
    loadLogros(sel);
  };
  const desbloquearSemana = async (semana: number) => {
    if (!sel) return;
    await rpc("desbloquear_semana", { p_pass: pass, p_jugador: sel, p_semana: semana });
    toast.success(`Semana ${semana} desbloqueada`);
    loadLogros(sel);
  };

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">Logros</h1>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="rounded-2xl bg-surface border border-white/5 p-2 h-fit max-h-[70vh] overflow-y-auto">
          {players.map((p) => (
            <button key={p.id} onClick={() => setSel(p.id)} className={`w-full text-left px-3 py-2 rounded-lg ${sel === p.id ? "bg-gold text-gold-foreground" : "hover:bg-white/5"}`}>
              {p.nombre}<span className="text-xs opacity-60 ml-2">{p.grupo}·{p.mes}</span>
            </button>
          ))}
        </div>
        <div>
          {!sel ? <div className="text-muted-foreground">Selecciona un jugador</div> : (
            <div className="space-y-6">
              {LOGROS_POR_SEMANA.map((sec, idx) => (
                <div key={sec.titulo}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display">{sec.titulo} — {sec.subtitulo}</h3>
                    <button onClick={() => desbloquearSemana(idx + 1)} className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10">
                      Desbloquear semana
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {sec.logros.map((l) => {
                      const cur = logros.find((x) => x.logro_codigo === l.codigo);
                      const on = cur?.desbloqueado ?? false;
                      return (
                        <button key={l.codigo} onClick={() => toggle(l.codigo, !on)}
                          className={`text-left rounded-xl p-4 border transition ${on ? "bg-gold/15 border-gold text-foreground" : "bg-surface border-white/5"}`}>
                          <div className="text-xl">{on ? "🏅" : "🔒"}</div>
                          <div className="mt-1 font-medium text-sm">{l.nombre}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Reportes ----------------
function SecReportes({ pass }: { pass: string }) {
  const [players, setPlayers] = useState<Jugador[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [grupoFiltro, setGrupoFiltro] = useState<"TODOS" | "A" | "B">("TODOS");
  const [publicados, setPublicados] = useState<{ count: number; grupo: string; mes: string } | null>(null);
  const [showCodigos, setShowCodigos] = useState(false);

  useEffect(() => { rpc<Jugador[]>("listar_jugadores", { p_pin: pass }).then(setPlayers); }, [pass]);

  const filtered = players.filter((p) => grupoFiltro === "TODOS" || p.grupo === grupoFiltro);

  const publicarGrupo = async (grupo: string, mes: string) => {
    if (!confirm(`Publicar TODOS los reportes de Grupo ${grupo}·${mes}?`)) return;
    await rpc("publicar_grupo", { p_pass: pass, p_grupo: grupo, p_mes: mes });
    const count = players.filter((p) => p.grupo === grupo && p.mes === mes).length;
    setPublicados({ count, grupo, mes });
    setShowCodigos(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-display mb-6 no-print">Reportes</h1>
      {publicados && (
        <div className="mb-4 rounded-xl bg-success/15 border border-success/40 p-4 no-print flex flex-wrap items-center gap-3 justify-between animate-fade-in">
          <div className="text-sm">
            <span className="font-display text-success">{publicados.count} reportes publicados.</span>{" "}
            <span className="text-muted-foreground">Comparte los links con las familias.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCodigos((s) => !s)} className="text-xs px-3 py-2 rounded-lg bg-gold text-gold-foreground font-semibold">
              {showCodigos ? "Ocultar códigos" : "Ver códigos"}
            </button>
            <button onClick={() => setPublicados(null)} className="text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10">Cerrar</button>
          </div>
          {showCodigos && (
            <div className="w-full mt-2 pt-3 border-t border-white/10 grid sm:grid-cols-2 gap-2">
              {players.filter((p) => p.grupo === publicados.grupo && p.mes === publicados.mes).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-sm bg-background/50 rounded-lg px-3 py-2">
                  <span>{p.nombre}</span>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/progreso/${p.codigo_familia}`); toast.success("Link copiado"); }} className="font-mono text-gold text-xs hover:underline">
                    {p.codigo_familia}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="rounded-2xl bg-surface border border-white/5 p-2 h-fit max-h-[70vh] overflow-y-auto no-print">
          <div className="p-2 flex gap-1">
            {(["TODOS", "A", "B"] as const).map((g) => (
              <button key={g} onClick={() => setGrupoFiltro(g)}
                className={`flex-1 text-xs px-2 py-1 rounded-lg ${grupoFiltro === g ? "bg-gold text-gold-foreground" : "bg-white/5"}`}>
                {g === "TODOS" ? "Todos" : `Grupo ${g}`}
              </button>
            ))}
          </div>
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSel(p.id)} className={`w-full text-left px-3 py-2 rounded-lg ${sel === p.id ? "bg-gold text-gold-foreground" : "hover:bg-white/5"}`}>
              {p.nombre}<span className="text-xs opacity-60 ml-2">{p.grupo}·{p.mes}</span>
            </button>
          ))}
          <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
            <button onClick={() => publicarGrupo("A", "julio")} className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10">Publicar todo Grupo A · julio</button>
            <button onClick={() => publicarGrupo("B", "julio")} className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10">Publicar todo Grupo B · julio</button>
          </div>
        </div>
        <div>
          {sel && <ReporteView pass={pass} jugadorId={sel} jugador={players.find((p) => p.id === sel)!} />}
          {!sel && <div className="text-muted-foreground">Selecciona un jugador para ver su reporte.</div>}
        </div>
      </div>
    </div>
  );
}

function ReporteView({ pass, jugadorId, jugador }: { pass: string; jugadorId: string; jugador: Jugador }) {
  const [data, setData] = useState<{ diarias: EvalDiaria[]; tecnicas: EvalTec[]; logros: LogroPortal[]; reporte: { mensaje: string | null; fecha: string | null; publicado: boolean } } | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [pub, setPub] = useState(false);

  const load = async () => {
    const portal = await rpc<{ diarias: EvalDiaria[]; tecnicas: EvalTec[]; logros: LogroPortal[] }>("get_portal_data", { p_codigo: jugador.codigo_familia });
    const rep = await rpc<{ mensaje_coach: string; publicado: boolean; fecha_publicacion: string | null }[]>("get_reporte", { p_pass: pass, p_jugador: jugadorId });
    setMensaje(rep[0]?.mensaje_coach ?? "");
    setPub(rep[0]?.publicado ?? false);
    setData({
      diarias: portal.diarias, tecnicas: portal.tecnicas, logros: portal.logros,
      reporte: { mensaje: rep[0]?.mensaje_coach ?? null, fecha: rep[0]?.fecha_publicacion ?? null, publicado: rep[0]?.publicado ?? false },
    });
  };
  useEffect(() => { load(); }, [jugadorId]); // eslint-disable-line

  if (!data) return <div className="text-muted-foreground">Cargando…</div>;

  const guardar = async () => {
    await rpc("guardar_reporte", { p_pass: pass, p_jugador: jugadorId, p_mensaje: mensaje });
    toast.success("Mensaje guardado");
  };
  const publicar = async () => {
    await rpc("publicar_reporte", { p_pass: pass, p_jugador: jugadorId, p_publicado: !pub });
    setPub(!pub);
    toast.success(pub ? "Reporte oculto" : "Reporte publicado");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 no-print">
        <button onClick={() => window.print()} className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm">🖨 Imprimir</button>
        <button onClick={publicar} className={`h-10 px-4 rounded-xl text-sm font-semibold ${pub ? "bg-success text-black" : "bg-gold text-gold-foreground"}`}>{pub ? "Publicado ✓" : "Publicar en portal"}</button>
      </div>
      <ReporteImprimible jugador={jugador} data={data} mensaje={mensaje} publicado={pub} />
      <div className="no-print">
        <label className="block text-xs uppercase tracking-widest text-muted-foreground">Mensaje del coach</label>
        <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} className="mt-2 w-full h-28 p-3 rounded-xl bg-surface border border-white/10" />
        <button onClick={guardar} className="mt-2 h-10 px-4 rounded-xl bg-gold text-gold-foreground text-sm font-semibold">Guardar mensaje</button>
      </div>
    </div>
  );
}

type EvalDiaria = { fecha: string; semana: number; asistencia: string; esfuerzo: number | null; aplicacion_tactica: number | null; trabajo_equipo: number | null; comunicacion: number | null };
type EvalTec = { semana: number; indicador: string; valor: number };
type LogroPortal = { codigo: string; desbloqueado: boolean };

function promedios(diarias: EvalDiaria[], semana: number) {
  const filas = diarias.filter((d) => d.semana === semana && d.asistencia !== "ausente");
  const avg = (k: keyof EvalDiaria) => {
    const vals = filas.map((f) => f[k]).filter((v): v is number => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  return {
    esfuerzo: avg("esfuerzo"), aplicacion_tactica: avg("aplicacion_tactica"),
    trabajo_equipo: avg("trabajo_equipo"), comunicacion: avg("comunicacion"),
  };
}

function ReporteImprimible({ jugador, data, mensaje, publicado }: { jugador: Jugador; data: { diarias: EvalDiaria[]; tecnicas: EvalTec[]; logros: LogroPortal[] }; mensaje: string; publicado: boolean }) {
  const s1 = promedios(data.diarias, 1);
  const s4 = promedios(data.diarias, 4);
  const puntuales = data.diarias.filter((d) => d.asistencia === "puntual").length;
  const total = data.diarias.length;
  const desbloqueados = data.logros.filter((l) => l.desbloqueado).length;

  const cambioActitud = (a: number | null, b: number | null) => {
    if (a == null || b == null) return { txt: "Sin comparativo", cls: "text-muted-foreground" };
    const d = b - a;
    const sign = d > 0 ? "+" : "";
    const arrow = d > 0 ? "↑" : d < 0 ? "↓" : "=";
    const cls = d > 0 ? "text-success" : d < 0 ? "text-destructive" : "text-warning";
    return { txt: `${sign}${d.toFixed(1)} ${arrow}`, cls };
  };
  const cambioTec = (a: number | null, b: number | null) => {
    if (a == null || b == null) return { txt: "Sin comparativo", cls: "text-muted-foreground" };
    const d = b - a;
    const sign = d > 0 ? "+" : "";
    const arrow = d > 0 ? "↑" : d < 0 ? "↓" : "=";
    const cls = d > 0 ? "text-success" : d < 0 ? "text-destructive" : "text-warning";
    return { txt: `${sign}${d} ${arrow}`, cls };
  };
  const tecVal = (semana: number, ind: string) => {
    const row = data.tecnicas.find((t) => t.semana === semana && t.indicador === ind);
    return row ? row.valor : null;
  };
  const indTec: [string, string][] = [
    ["conduccion", "Conducción controlada"],
    ["pase", "Pase con precisión"],
    ["recepcion", "Recepción limpia"],
    ["control_aereo", "Control aéreo con pecho"],
    ["remate", "Remate orientado"],
  ];

  return (
    <div className="print-page bg-surface border border-white/5 rounded-2xl p-6 text-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <Logo variant="full" size={40} />
        <div className="text-right">
          <div className="font-display text-lg">Reporte de progreso</div>
          <div className="text-xs text-muted-foreground capitalize">Grupo {jugador.grupo} · {jugador.mes} 2026</div>
        </div>
      </div>
      <h2 className="text-2xl font-display">{jugador.nombre}</h2>

      <h3 className="mt-6 font-display text-sm uppercase tracking-widest text-muted-foreground">Comparativo S1 → S4</h3>
      <table className="w-full mt-2 border-collapse text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr><th className="text-left py-2">Indicador</th><th className="text-center">S1</th><th className="text-center">S4</th><th className="text-center">Cambio</th></tr>
        </thead>
        <tbody>
          <tr><td colSpan={4} className="pt-3 pb-1 text-xs uppercase tracking-widest text-gold">Actitud (promedio del mes)</td></tr>
          {INDICADORES_ACTITUD.map((ind) => {
            const a = s1[ind.key as keyof typeof s1]; const b = s4[ind.key as keyof typeof s4];
            const c = cambioActitud(a, b);
            return (
              <tr key={ind.key} className="border-t border-white/5">
                <td className="py-2">{ind.label}</td>
                <td className="text-center">{a?.toFixed(1) ?? "—"}</td>
                <td className="text-center">{b?.toFixed(1) ?? "—"}</td>
                <td className={`text-center ${c.cls}`}>{c.txt}</td>
              </tr>
            );
          })}
          <tr><td colSpan={4} className="pt-4 pb-1 text-xs uppercase tracking-widest text-gold">Técnica</td></tr>
          {indTec.map(([key, label]) => {
            const a = tecVal(1, key); const b = tecVal(4, key);
            const c = cambioTec(a, b);
            return (
              <tr key={key} className="border-t border-white/5">
                <td className="py-2">{label}</td>
                <td className="text-center">{a ?? "—"}</td>
                <td className="text-center">{b ?? "—"}</td>
                <td className={`text-center ${c.cls}`}>{c.txt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>


      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Asistencia</h3>
          <div className="mt-2 text-2xl font-display">{puntuales}<span className="text-sm text-muted-foreground"> / {total} puntuales</span></div>
        </div>
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Logros</h3>
          <div className="mt-2 text-2xl font-display">{desbloqueados}<span className="text-sm text-muted-foreground"> / 16 desbloqueados</span></div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 sm:grid-cols-8 gap-2">
        {data.logros.map((l) => (
          <div key={l.codigo} className={`h-10 rounded-lg flex items-center justify-center text-lg ${l.desbloqueado ? "bg-gold text-gold-foreground" : "bg-muted opacity-40"}`}>🏅</div>
        ))}
      </div>

      {publicado && mensaje && (
        <div className="mt-6 rounded-xl border-2 border-gold/60 p-4">
          <div className="text-xs uppercase tracking-widest text-gold">Mensaje del coach</div>
          <div className="mt-2 leading-relaxed">{mensaje}</div>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-white/10 text-xs text-muted-foreground text-center">
        Coach · White Lions Academy · Clínica de Verano 2026
      </div>
    </div>
  );
}

// ---------------- Config ----------------
function SecConfig({ pass }: { pass: string }) {
  const [cfg, setCfg] = useState<ConfigRow | null>(null);
  const [foto, setFoto] = useState({ grupo: "A", mes: "julio", semana: 1, url: "" });

  useEffect(() => { rpc<ConfigRow[]>("get_config", { p_pin: pass }).then((r) => setCfg(r[0])); }, [pass]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfg) return;
    await rpc("actualizar_config", {
      p_pass: pass, p_mes_activo: cfg.mes_activo, p_semana_activa: cfg.semana_activa,
      p_pin_coach: cfg.pin_coach, p_password_admin: cfg.password_admin,
    });
    toast.success("Configuración guardada");
  };

  const subirFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    await rpc("subir_foto", { p_pass: pass, p_grupo: foto.grupo, p_mes: foto.mes, p_semana: foto.semana, p_url: foto.url });
    toast.success("Foto añadida");
    setFoto({ ...foto, url: "" });
  };

  if (!cfg) return <div>Cargando…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display mb-6">Configuración</h1>
      <form onSubmit={guardar} className="bg-surface border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase text-muted-foreground">Mes activo</label>
            <select value={cfg.mes_activo} onChange={(e) => setCfg({ ...cfg, mes_activo: e.target.value })} className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-white/10 capitalize">
              {MESES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Semana activa</label>
            <select value={cfg.semana_activa} onChange={(e) => setCfg({ ...cfg, semana_activa: Number(e.target.value) })} className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-white/10">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Semana {n}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase text-muted-foreground">PIN del coach</label>
            <input value={cfg.pin_coach} onChange={(e) => setCfg({ ...cfg, pin_coach: e.target.value })} maxLength={4} className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-white/10 font-mono" />
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Contraseña admin</label>
            <input value={cfg.password_admin} onChange={(e) => setCfg({ ...cfg, password_admin: e.target.value })} className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-white/10 font-mono" />
          </div>
        </div>
        <button className="h-11 px-5 rounded-xl bg-gold text-gold-foreground font-semibold">Guardar</button>
      </form>

      <form onSubmit={subirFoto} className="mt-6 bg-surface border border-white/5 rounded-2xl p-5 space-y-3">
        <h2 className="font-display">Subir foto semanal</h2>
        <div className="grid grid-cols-3 gap-3">
          <select value={foto.grupo} onChange={(e) => setFoto({ ...foto, grupo: e.target.value })} className="h-10 px-3 rounded-xl bg-background border border-white/10">
            <option>A</option><option>B</option>
          </select>
          <select value={foto.mes} onChange={(e) => setFoto({ ...foto, mes: e.target.value })} className="h-10 px-3 rounded-xl bg-background border border-white/10 capitalize">
            {MESES.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select value={foto.semana} onChange={(e) => setFoto({ ...foto, semana: Number(e.target.value) })} className="h-10 px-3 rounded-xl bg-background border border-white/10">
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Sem {n}</option>)}
          </select>
        </div>
        <input required value={foto.url} onChange={(e) => setFoto({ ...foto, url: e.target.value })} placeholder="URL de imagen (https://…)" className="w-full h-11 px-3 rounded-xl bg-background border border-white/10" />
        <button className="h-11 px-5 rounded-xl bg-gold text-gold-foreground font-semibold">Añadir foto</button>
      </form>
      <p className="text-xs text-muted-foreground mt-6">Zona horaria: America/Tijuana · {fechaLarga(new Date().toISOString().slice(0, 10))}</p>
    </div>
  );
}
