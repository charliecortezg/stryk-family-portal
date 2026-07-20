## Agregar jugador nuevo

Insertar en la tabla `jugadores` al nuevo inscrito de la Clínica de Verano 2026:

- **Nombre:** Fabián Inzunza Estrella
- **Grupo:** `V26` (grupo único Verano 2026)
- **Mes:** `julio`
- **Activo:** true
- **Código familiar:** autogenerado por la base

El trigger existente creará automáticamente sus 16 logros y su reporte vacío.

### Datos que NO se guardan (no hay columnas en el esquema)
Igual que con los otros 6 jugadores, estos datos del mensaje quedan fuera salvo que pidas agregar columnas:
- Edad: 10 años
- Nombre en camiseta: Fabián
- Número: 23
- Talla: 10
- Contacto madre: Paulina Estrella Chávez — 6864711305

### Entrega
Tras la inserción te reporto el **código familiar generado** para compartirlo con la familia (formato igual a los otros: `XXXXXX`).

### Verificación
- Coach verá 7 jugadores en la lista (antes 6).
- Sin evaluaciones previas, listo para Semana 1.
- Sin cambios de UI ni de lógica.
