// Shared helpers for the admin login. Files starting with "_" are not served as routes.
const crypto = require("crypto");

const COOKIE = "favs_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(exp) {
  return crypto.createHmac("sha256", process.env.ADMIN_PASSWORD || "").update("favs-admin." + exp).digest("hex");
}
function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
function isConfigured() { return !!process.env.ADMIN_PASSWORD; }
function checkPassword(pw) { return isConfigured() && safeEqual(pw, process.env.ADMIN_PASSWORD); }
function sessionCookie() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}
function clearCookie() { return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`; }
function isLoggedIn(req) {
  if (!isConfigured()) return false;
  const m = (req.headers.cookie || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=(\\d+)\\.([0-9a-f]{64})"));
  if (!m) return false;
  if (Number(m[1]) < Date.now() / 1000) return false;
  return safeEqual(m[2], sign(m[1]));
}
function readJson(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 300000) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (_) { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}
module.exports = { isConfigured, checkPassword, sessionCookie, clearCookie, isLoggedIn, readJson };
