
## Objetivo

Permitir al coach navegar a días anteriores del curso y capturar/editar asistencia y evaluaciones diarias sin perder el trabajo del día actual. Ayer (día 1 de S1) queda accesible con un toque.

## Cambios en `/coach`

### 1. Estado de fecha seleccionada
- `CoachApp` mantiene `fechaSel` (default = `tijuanaHoy()`).
- Se pasa a `ListaDia` y a `IndividualEval` en vez de `hoy` fijo.
- Todas las RPCs de guardado (`registrar_asistencia`, `guardar_evaluacion_diaria`, `guardar_evaluacion_tecnica`) ya reciben `p_fecha` → solo cambia el valor pasado.

### 2. Header con selector de día
Debajo del header actual (mes · semana) se agrega una fila con:
- Botón "◀" día anterior / "▶" día siguiente (limitados al rango del curso).
- Etiqueta central tipo "Lun 20 jul · Hoy" (o "Ayer", o fecha larga) — tocable, abre bottom sheet de calendario.
- Chip discreto "Hoy" que reaparece cuando `fechaSel ≠ hoy` para volver rápido.

Cuando `fechaSel ≠ hoy`, la lista muestra un banner sutil ámbar: "Editando <fecha>. Los cambios se guardan en ese día."

### 3. Bottom sheet de calendario
Nuevo componente `CalendarioSheet`:
- Muestra las 4 semanas del curso como grid (S1..S4 × Lun-Vie) — 20 días en total, calculados desde `config.fecha_inicio`.
- Cada celda: número de día + mes corto. Estados visuales:
  - **Hoy**: borde dorado.
  - **Seleccionado**: fondo dorado.
  - **Futuro**: opacidad reducida, deshabilitado.
  - **Fin de semana / fuera de curso**: no se renderiza.
  - **Con registros**: punto verde/ámbar/rojo según asistencia agregada (opcional en v1 — si complica, solo se muestra sin punto).
- Encabezado con nombre de la semana (Fundamentos, Conexión…) por fila.
- Tocar día → cierra sheet + actualiza `fechaSel`. Al seleccionar día de otra semana, **no** cambia `semana_activa` automáticamente; solo actualiza la fecha (el guardado usa `p_semana` = semana calculada de esa fecha, no la activa).

### 4. Semana derivada de la fecha seleccionada
- Helper `semanaDeFecha(fechaInicio, fecha)` → 1..4 o null.
- `ListaDia` e `IndividualEval` reciben `semanaEval = semanaDeFecha(cfg.fecha_inicio, fechaSel) ?? cfg.semana_activa` y la usan para `p_semana` al guardar y para decidir qué indicadores técnicos mostrar.
- Esto evita que capturar en ayer registre semana equivocada.

### 5. Días futuros bloqueados
- No se permite seleccionar fechas > hoy (Tijuana). El sheet las muestra deshabilitadas.

## Sin cambios

- No se toca la base de datos (las RPCs ya aceptan fecha/semana arbitrarias, y `guardar_evaluacion_diaria` hace UPSERT por `(jugador_id, fecha)`).
- No se toca la lógica de progreso, portal familiar, ni admin.
- No se altera `semana_activa` al navegar; ese cambio sigue siendo explícito desde el sheet actual.

## Detalles técnicos

- Rango de días: `fecha_inicio` + i, con i ∈ 0..26 filtrando fines de semana → 20 hábiles.
- Formato "Ayer/Hoy/Mañana" con comparación ISO contra `tijuanaHoy()`.
- Estilo: mismo `card-elevated`, `animate-scale-in`, botón dorado. Sin librerías nuevas.
