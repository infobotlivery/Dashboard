// Servidor mínimo del tablero "Año de 12 Semanas". Sin dependencias: solo Node 18+.
// Sirve la app (carpeta public/) y guarda el estado en un archivo JSON dentro de DATA_DIR.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.APP_TOKEN;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const PUBLIC = path.join(__dirname, "public");
const FILE = path.join(DATA_DIR, "state.json");

if (!TOKEN || TOKEN.length < 8) {
  console.error("Falta APP_TOKEN (mínimo 8 caracteres). Es el código de acceso al tablero.");
  process.exit(1);
}
fs.mkdirSync(DATA_DIR, { recursive: true });
// Primera vez (volumen vacío): arrancar con el plan completo incluido en seed-state.json
const SEED_FILE = path.join(__dirname, "seed-state.json");
if (!fs.existsSync(FILE) && fs.existsSync(SEED_FILE)) {
  fs.copyFileSync(SEED_FILE, FILE);
  console.log("Estado inicial cargado desde seed-state.json");
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon"
};

function readState() { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { return null; } }
function writeState(state) {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state));
  try { fs.copyFileSync(FILE, FILE + ".bak"); } catch (e) {}
  fs.renameSync(tmp, FILE);
  // una copia por día, por si algo sale mal
  const snap = path.join(DATA_DIR, "snapshot-" + new Date().toISOString().slice(0, 10) + ".json");
  if (!fs.existsSync(snap)) fs.copyFileSync(FILE, snap);
}
function authorized(req) {
  const h = req.headers["authorization"] || "";
  const given = Buffer.from(h.startsWith("Bearer ") ? h.slice(7) : "");
  const want = Buffer.from(TOKEN);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}
function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "application/json", "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/healthz") return send(res, 200, { ok: true });

  if (url.pathname === "/api/state") {
    if (!authorized(req)) return send(res, 401, { error: "no autorizado" });
    if (req.method === "GET") return send(res, 200, { state: readState() });
    if (req.method === "PUT") {
      let size = 0; const chunks = [];
      req.on("data", (c) => { size += c.length; if (size > 2e6) { req.destroy(); } else chunks.push(c); });
      req.on("end", () => {
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (e) { return send(res, 400, { error: "JSON inválido" }); }
        if (!body || !Array.isArray(body.tasks)) return send(res, 400, { error: "falta tasks" });
        const cur = readState();
        const curRev = cur ? cur.rev || 0 : 0;
        if ((body.baseRev || 0) !== curRev) return send(res, 409, { error: "conflicto", state: cur });
        const next = { rev: curRev + 1, tasks: body.tasks, closures: body.closures || {}, updatedAt: new Date().toISOString() };
        writeState(next);
        return send(res, 200, { rev: next.rev });
      });
      return;
    }
    return send(res, 405, { error: "método no permitido" });
  }

  // archivos estáticos
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) return send(res, 403, "prohibido", "text/plain");
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "no encontrado", "text/plain");
    const type = MIME[path.extname(file)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": rel.endsWith(".png") ? "public, max-age=86400" : "no-cache" });
    res.end(data);
  });
});
server.listen(PORT, () => console.log("Tablero escuchando en el puerto " + PORT));
