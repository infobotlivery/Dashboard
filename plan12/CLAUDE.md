# Instrucciones para Claude Code

## Qué es
Tablero personal de Jesús para su "Año de 12 Semanas" (ciclo del 5 de octubre al 27 de diciembre de 2026, 13 semanas). La interfaz está en español y no debe cambiar de idioma. Metodología: Kanban de Sofía Contreras (Tareas, Semana, Hoy, Hecho) más la rutina semanal del libro "The 12 Week Year" (puntaje de ejecución = tareas hechas / tareas planeadas, meta 85%).

## Arquitectura
- `public/index.html`: toda la app (HTML, CSS y JavaScript vanilla, sin build ni dependencias). No introducir frameworks ni paso de compilación sin pedirlo.
- `server.js`: Node sin dependencias. Sirve `public/` y expone `GET/PUT /api/state`. Auth con `Authorization: Bearer <APP_TOKEN>`. Estado en `DATA_DIR/state.json` (con `.bak` y un snapshot diario).
- `public/sw.js` + `manifest.webmanifest`: PWA. El service worker nunca cachea `/api/`. Al cambiar archivos de `public/`, subir la versión de `CACHE` en `sw.js`.

## Protocolo de sincronización
- El estado es `{ rev, tasks, closures, updatedAt }`. El cliente guarda en `localStorage` (clave `semana4.v1`) y sube con `PUT { baseRev, tasks, closures }` 600 ms después de cada cambio.
- Si `baseRev` no coincide con la `rev` del servidor, responde **409** con el estado actual y el cliente lo adopta (guardando antes una copia en `semana4.v1.bak`).
- El cliente consulta el servidor al abrir, cada 30 s y al volver a la pestaña.
- El código de acceso se guarda en `localStorage` bajo `plan12.token`. No renombrar estas claves: rompería los datos ya guardados.

## Modelo de datos
Tarea: `{ id, t, c, w, d, s, dd, mv?, fr? }`
- `c`: `"tareas"` (depósito), `"semana"` o `"hecho"`.
- `w`: semana del ciclo (1 a 13), o `0` si está en el depósito.
- `d`: día de la semana, `0` lunes a `6` domingo, o `-1` si no tiene día.
- `s`: `1` si es la estrella de su día. Hay una estrella por semana y día.
- `dd`: fecha ISO en que se cerró. `mv`: semana a la que "pasó" al cerrar. `fr`: semana de la que viene una copia.
- **"Hoy" no se guarda**: se deriva (`c==="semana"` y `w` y `d` coinciden con la semana y el día elegidos).

Cierre de semana: `closures[w] = { pct, done, tot, a, b, c, moved, date }`. Al cerrar, las tareas pendientes se **copian** a la semana siguiente (con `fr`) y los originales se quedan en su semana (con `mv`) para que el porcentaje real no cambie. El puntaje guardado en el cierre es el que se muestra para esa semana.

## Tareas pendientes de ti
1. Pregunta a Jesús dónde está su servidor (¿Dokploy? ¿otro?) y qué subdominio quiere.
2. Despliega con HTTPS, volumen persistente en `/data` y un `APP_TOKEN` fuerte (mínimo 8 caracteres; usa uno largo y aleatorio). Entrégaselo a Jesús una sola vez y no lo dejes en el repo.
3. Verifica `/healthz`, `GET /api/state` sin token (debe dar 401) y con token.
4. Prueba la sincronización con dos navegadores distintos: lo que se cambia en uno aparece en el otro.
5. No hay migración de datos: el servidor arranca con `seed-state.json`. Si Jesús pide corregir qué tareas están hechas, edita ese archivo antes del primer arranque (o bórralo del volumen y reinicia).
6. Confirma que se instala como PWA en iPhone (Safari, Agregar a pantalla de inicio).
7. Déjale un procedimiento corto para redeployar cuando pida cambios.

## Cuidados
- El estado inicial vive en `seed-state.json` (y una copia en `seed()` dentro de `index.html`, por si el servidor no responde la primera vez). Si cambias uno, cambia el otro. Después de la primera vez manda el servidor.
- Las fechas del ciclo salen de `START = new Date(2026,9,5)` en `index.html`. Si empieza otro ciclo, hay que actualizarla.
- Hay un solo usuario. No agregar cuentas ni registro sin que lo pida.
- Si el servidor falla, la app sigue funcionando con `localStorage` y vuelve a sincronizar cuando regresa.
