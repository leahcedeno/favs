// POST {password}: checks it against the ADMIN_PASSWORD secret stored in Vercel and starts a 30-day session.
const { isConfigured, checkPassword, sessionCookie, readJson } = require("./_auth");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });
  if (!isConfigured()) return res.status(503).json({ ok: false, error: "The admin password hasn't been set in Vercel yet." });
  const body = await readJson(req);
  await new Promise((r) => setTimeout(r, 600)); // slows down guessing
  if (!checkPassword(body.password || "")) return res.status(401).json({ ok: false, error: "Wrong password." });
  res.setHeader("Set-Cookie", sessionCookie());
  return res.status(200).json({ ok: true });
};
