# STRYK — Plan de implementación

App de evaluación deportiva para White Lions Academy (Clínica Verano 2026). Cuatro superficies: home pública, coach (PIN, móvil), admin (contraseña, desktop), portal familia (código público). Tema oscuro premium con acento dorado, portal familia en claro. Español México en toda la UI.

## 1. Backend — Lovable Cloud (Supabase)

Habilitar Lovable Cloud y crear una migración con todas las tablas descritas:

- `jugadores`, `evaluaciones_diarias` (UNIQUE jugador+fecha), `evaluaciones_tecnicas`, `logros` (UNIQUE jugador+codigo), `fotos_semanales`, `reportes`, `config` (fila única id=1).
- Trigger `after insert on jugadores` que inserta los 16 registros de `logros` (códigos listados en el brief) con `desbloqueado=false`.
- Función `generar_codigo_familia()` para 6 chars alfabéticos/numéricos excluyendo O,0,I,1,L (fallback también en cliente al crear jugador).
- RLS:
  - Portal familia: SELECT público filtrado — políticas `TO anon` en `jugadores`, `evaluaciones_diarias`, `evaluaciones_tecnicas`, `logros`, `fotos_semanales`, `reportes` (solo cuando `publicado=true`), todas restringidas por `jugador_id` que pertenezca a un `codigo_familia` conocido. Se usará una RPC `get_portal_data(codigo text)` como SECURITY DEFINER que devuelve todo el payload del jugador en una llamada; RLS bloquea acceso directo a filas ajenas.
  - Coach/Admin: se autentican con PIN/contraseña vía RPC `verificar_pin(pin)` / `verificar_admin(pass)` (SECURITY DEFINER contra `config`); tras verificar, el frontend guarda flag en localStorage. Las escrituras se hacen mediante RPCs SECURITY DEFINER (`registrar_asistencia`, `guardar_evaluacion_diaria`, `guardar_evaluacion_tecnica`, `toggle_logro`, `desbloquear_semana`, `guardar_reporte`, `publicar_reporte`, `crear_jugador`, `set_activo`, `subir_foto`, `actualizar_config`) que aceptan el PIN/pass como argumento y validan antes de mutar. Así las tablas no requieren rol anon con INSERT/UPDATE directos.
- Seed en migración: 3 jugadores Grupo A julio con evaluaciones diarias/técnicas, algunos logros desbloqueados y foto de ejemplo.
- GRANTS explícitos por tabla y GRANT EXECUTE en RPCs a `anon` y `authenticated`.

## 2. Diseño

`src/styles.css`:
- `@import` de Google Fonts Archivo Black + Inter via `<link>` en `__root.tsx` (no en CSS).
- Tokens oklch: `--background 0F1729`, `--surface 1A2842`, `--gold DDA82D`, `--success 22C55E`, `--warning F59E0B`, `--destructive EF4444`, `--foreground F8FAFC`, `--muted-foreground 94A3B8`, `--radius 0.75rem`.
- Variantes para tema claro en portal familia via `.theme-light` scoped.
- Utilities: `.font-display` (Archivo Black), animación `achievement-shine` (brillo dorado sutil).

Componente `<Logo size variant>` con el SVG inline (mark) + wordmark "STRYK" (Archivo Black) y subtítulo "WHITE LIONS ACADEMY" (Inter, tracking amplio).

## 3. Rutas (TanStack)

- `src/routes/index.tsx` — Home pública con hero + input código + secciones cómo funciona / 10 indicadores / logros / footer.
- `src/routes/coach.tsx` — máquina de estados cliente: PIN → selección grupo → tabs (Lista / Técnica / Resumen). Sesión en localStorage 12h. Botones ≥48px. Autosave.
- `src/routes/admin.tsx` — password gate + shadcn sidebar con 5 secciones (Jugadores, Semáforo, Logros, Reportes, Configuración). Reporte imprimible con `@media print`.
- `src/routes/progreso.$codigo.tsx` — llama RPC `get_portal_data`, tema claro, 6 secciones. Header oscuro. Renderiza solo lo permitido.

Fecha/semana: helper `tijuanaToday()` usando `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' })`.

## 4. Head/PWA

- `public/manifest.json` con contenido exacto del brief.
- `__root.tsx`: title "STRYK — Evaluación White Lions Academy", meta description, theme-color, apple-touch, manifest, fuentes vía `<link>`. Se dejan referencias a `/icons/...` aunque los PNG los suba el usuario después.

## 5. Detalles técnicos

- Skeletons con shadcn Skeleton.
- Toasts en español para errores.
- Mobile-first en todas las vistas; admin usa sidebar colapsable.
- No auth Supabase — todas las mutaciones a través de RPCs con PIN/pass; RLS por defecto DENY.
- Copiar link del portal: `${window.location.origin}/progreso/CODIGO`.

## Entregables

1. Migración SQL completa (tablas, trigger, RPCs, RLS, GRANTS, seed).
2. `manifest.json` y meta tags PWA.
3. Design system oscuro + variante clara portal.
4. Componente `<Logo />` y componentes UI compartidos (Rating 1-5, AsistenciaButtons, LogroBadge, BarraSemanal).
5. Cuatro rutas completas con toda la funcionalidad descrita.
6. Seed de 3 jugadores Grupo A julio.

Al terminar: PIN coach `2026`, contraseña admin `wl2026admin`, tres códigos de familia visibles en el panel admin para probar el portal.
