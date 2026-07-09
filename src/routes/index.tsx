import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { INDICADORES_10, LOGROS_POR_SEMANA } from "@/lib/stryk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STRYK — Evaluación White Lions Academy" },
      {
        name: "description",
        content:
          "El progreso de tu hijo, medido semana a semana. Sistema de evaluación individual de White Lions Academy.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const nav = useNavigate();
  const [codigo, setCodigo] = useState("");

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    const c = codigo.trim().toUpperCase();
    if (c.length >= 4) nav({ to: "/progreso/$codigo", params: { codigo: c } });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div
          className="absolute inset-x-0 top-0 h-[500px] pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at top, oklch(0.78 0.145 82 / 0.25), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <Logo variant="full" size={64} className="mx-auto" />
          <h1 className="mt-10 text-4xl sm:text-6xl font-display leading-[1.05]">
            El progreso de tu hijo,
            <br />
            <span className="text-gold">medido semana a semana</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Sistema de evaluación individual de White Lions Academy. 10 indicadores. 4 semanas. Un
            reporte real de crecimiento.
          </p>

          <form
            onSubmit={entrar}
            className="mt-10 mx-auto max-w-md bg-surface rounded-2xl p-4 sm:p-5 gold-glow border border-white/5"
          >
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Ingresa tu código de familia
            </label>
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 min-w-0 h-12 px-4 rounded-xl bg-background border border-white/10 text-lg font-display tracking-widest text-center uppercase focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="h-12 px-6 rounded-xl bg-gold text-gold-foreground font-semibold hover:opacity-90 transition"
              >
                Ver progreso
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-display text-center">Cómo funciona</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Evaluación diaria",
                d: "El coach registra 5 indicadores de actitud todos los días directamente desde el campo.",
              },
              {
                n: "02",
                t: "Habilidades medibles",
                d: "Cada semana se evalúan habilidades técnicas con criterios exactos: conducción, pase, recepción, control y remate.",
              },
              {
                n: "03",
                t: "Reporte de progreso",
                d: "Al final del mes recibes un comparativo completo de la semana 1 contra la semana 4.",
              },
            ].map((c) => (
              <div
                key={c.n}
                className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-gold/40 transition"
              >
                <div className="text-gold font-display text-lg">{c.n}</div>
                <h3 className="mt-3 text-xl font-display">{c.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 INDICADORES */}
      <section className="px-5 py-16 sm:py-24 bg-surface/40">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-display text-center">Los 10 indicadores</h2>
          <p className="mt-3 text-center text-muted-foreground">
            Cada uno medido con criterios claros y consistentes.
          </p>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {INDICADORES_10.map((i) => (
              <div
                key={i.nombre}
                className="bg-surface border border-white/5 rounded-xl p-4 text-center hover:border-gold/40 transition"
              >
                <div className="text-2xl">{i.icon}</div>
                <div className="mt-2 text-xs sm:text-sm font-medium">{i.nombre}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOGROS */}
      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl sm:text-4xl font-display">Logros por desbloquear</h2>
          <p className="mt-3 text-muted-foreground">
            16 logros durante el programa. Uno diferente cada semana.
          </p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {LOGROS_POR_SEMANA.slice(0, 1)
              .flatMap((g) => g.logros)
              .map((l) => (
                <div
                  key={l.codigo}
                  className="rounded-2xl p-5 achievement-shine text-black"
                  style={{ boxShadow: "0 10px 30px -10px oklch(0.78 0.145 82 / 0.6)" }}
                >
                  <div className="text-2xl">🏅</div>
                  <div className="mt-2 text-sm font-semibold leading-tight">{l.nombre}</div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-5 py-10">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Logo variant="mark" size={28} />
            <span>White Lions Academy</span>
          </div>
          <div>Mexicali, B.C.</div>
          <a
            href="https://whitelionsacademy.com"
            className="hover:text-gold transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            whitelionsacademy.com
          </a>
        </div>
      </footer>
    </main>
  );
}
