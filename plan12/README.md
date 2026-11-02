# Año de 12 Semanas: tablero Kanban

Tablero con 4 columnas (Tareas, Semana, Hoy, Hecho), navegación por las 13 semanas del ciclo, cierre del día y cierre de la semana con porcentaje de ejecución. Los datos viven en **tu servidor**, así que se ven igual en Safari, Comet, el iPhone o cualquier dispositivo.

## Qué incluye
- `public/`: la app (una sola página, sin build) más manifest y service worker para instalarla como PWA.
- `server.js`: servidor de Node sin dependencias. Sirve la app y guarda el estado en `DATA_DIR/state.json`.
- `Dockerfile` y `docker-compose.yml`: para desplegarlo.
- `CLAUDE.md`: instrucciones para Claude Code.

## Probarlo en tu computadora
```bash
APP_TOKEN=un-codigo-largo-123 node server.js
# abre http://localhost:3000 y escribe el código cuando te lo pida
```
Necesita Node 18 o más. `APP_TOKEN` es el código de acceso (mínimo 8 caracteres): sin él, el servidor no arranca.

## Subirlo a tu subdominio (con Docker o Dokploy)
1. Crea un registro DNS para el subdominio (por ejemplo `plan.tudominio.com`) apuntando a tu servidor.
2. Despliega este proyecto desde el `Dockerfile` o el `docker-compose.yml`.
3. Define la variable de entorno `APP_TOKEN` con un código largo y secreto.
4. Monta un **volumen persistente en `/data`**. Sin eso, los datos se pierden al reiniciar.
5. Asigna el subdominio al puerto 3000 y activa HTTPS (Let's Encrypt). Sin HTTPS el iPhone no instala la app.
6. Comprueba `https://tu-subdominio/healthz`: debe responder `{"ok":true}`.

## Estado inicial
No hay nada que migrar: la primera vez que arranca el servidor con el volumen vacío, carga `seed-state.json`, que trae el plan completo a la fecha de entrega (semana 3 con lo hecho, semana 4 con sus tareas por día, las dos fechas fijas de noviembre y todo el depósito). Desde ahí, todo lo que cambies se guarda en el servidor y se ve igual en todos tus dispositivos.

Los datos que Jesús tenía en el artefacto de Claude no se pueden leer desde fuera (el navegador los guarda por dirección web). Si falta algo, se marca directamente en la app o se edita `seed-state.json` antes del primer arranque.

## Instalarla en el iPhone
Abre el subdominio en **Safari**, toca Compartir y luego **Agregar a pantalla de inicio**.

## Copias de seguridad
El servidor guarda `state.json`, `state.json.bak` (la versión anterior) y un `snapshot-AAAA-MM-DD.json` por día, todo dentro del volumen `/data`.

## Prueba rápida de la API
```bash
curl -H "Authorization: Bearer $APP_TOKEN" https://tu-subdominio/api/state
```

## Prompt para pegar en Claude Code
> Lee `CLAUDE.md` y `README.md` de este proyecto. Desplegalo en mi subdominio `<tu-subdominio>` en mi servidor (uso `<Dokploy / otro>`), con HTTPS, volumen persistente en `/data` y un `APP_TOKEN` fuerte que me entregas una sola vez. Verifica `/healthz`, prueba la sincronización con dos navegadores distintos y confirma que se instala como PWA en iPhone. Luego dime cómo hacer cambios y redeployar.
