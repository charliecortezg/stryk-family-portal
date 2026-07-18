## Cambios STRYK — jugadores reales + grupo único

### 1. Limpiar datos dummy

Borrar en orden (respetando FKs) todos los registros hijos y luego los 3 jugadores de prueba (Diego, Emiliano, Mateo):  
`reportes` → `logros` → `evaluaciones_tecnicas` → `evaluaciones_diarias` → `jugadores`.  
Verificar que `jugadores` queda vacío antes de insertar.

### 2. Grupo único "Verano 2026"

No se toca el esquema. Todos los jugadores nuevos se insertan con `grupo = 'V26'` (código corto para almacenamiento) y `mes = 'julio'`. La etiqueta visible en la UI será "Verano 2026".

Cambios de UI (solo presentación, sin tocar RPCs ni lógica):

- **src/routes/admin.tsx**
  - Crear jugador: quitar el `<select>` de grupo; fijar `grupo: "V26"` interno.
  - Semáforo: quitar el selector A/B; siempre consultar con `p_grupo: null` (la RPC `semaforo` requiere grupo, así que se ajusta también — ver Backend).
  - Reportes: quitar los chips `TODOS/A/B` y el filtro por grupo; mostrar un único listado.
  - Publicar en lote: reemplazar los dos botones "Publicar todo Grupo A/B · julio" por uno solo "Publicar todo · julio" que llame `publicar_grupo` con `p_grupo: 'V26'`.
  - Fotos semanales: quitar selector de grupo; fijar `grupo: "V26"`.
  - Cambiar el tipo `Jugador.grupo` de `"A" | "B"` a `string`.
- **src/routes/progreso.$codigo.tsx**
  - Quitar el badge "Grupo A · julio". Mostrar solo "Verano 2026 · julio" (o solo el mes).
  - Cambiar el tipo `jugador.grupo` a `string`.
- **src/routes/coach.tsx**: ya usa `p_grupo: null`, no requiere cambios.

### 3. Backend — ajuste mínimo al semáforo

La RPC `semaforo(p_grupo, p_mes, p_semana)` exige grupo no-nulo. Se relaja para aceptar `p_grupo IS NULL` = todos los grupos, alineándola con `listar_evaluaciones_dia`. No se cambia firma; solo el `WHERE`.

### 4. Insertar 6 jugadores reales

Insertar en `jugadores` con `grupo='V26'`, `mes='julio'`, `activo=true` y `codigo_familia` generado por `generar_codigo_familia()`. El trigger `sembrar_logros` crea automáticamente los 16 logros + fila en `reportes` para cada uno.

Jugadores:

1. Emilio Moisés Mayorga Galindo
2. Axel Iram Urrutia Guerra
3. Jaziel Salvador Rangel Cárdenas
4. Johan Daniel Rangel Cárdenas
5. Lucca Emiliano Cárdenas Covarrubias
6. Said López Cebreros

### 5. Datos no almacenados (reporte al usuario)

El esquema actual de `jugadores` tiene solo: `nombre, grupo, mes, codigo_familia, activo`. **No existen columnas** para:

- Edad
- Nombre en camiseta, número de camiseta, talla
- Contactos (padres, teléfonos, correos, emergencia)

Según la instrucción del usuario ("si no tiene campos, ignora esos datos sin crear columnas nuevas"), estos datos **no se guardarán**. Si más adelante los quiere en la base, se puede agregar en una migración aparte.

### 6. Verificación

- `SELECT count(*) FROM jugadores` → 6, todos con `grupo='V26'`.
- `SELECT count(*) FROM evaluaciones_diarias` / `evaluaciones_tecnicas` → 0.
- `config.semana_activa` no se toca.
- Recorrido rápido de /coach, /admin y /progreso/[codigo] para confirmar que no aparece "Grupo A" ni "Grupo B" en ningún lado.

&nbsp;

&nbsp;

Apruebo el plan completo. Antes de insertar, agrega una verificación:

&nbsp;

Revisa si la columna grupo en la tabla jugadores tiene un CHECK constraint 

o tipo enum limitado a 'A' y 'B'. Si existe, modifícalo para aceptar 'V26' 

(o cámbialo a text sin restricción). Haz esto ANTES del paso 4 para que 

los inserts no fallen.

&nbsp;

Todo lo demás, procede tal como lo planteaste.