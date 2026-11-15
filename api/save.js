// POST {top, order, move}: saves Leah's admin choices to overrides.json in the GitHub repo.
// Vercel redeploys on that commit, so the change is live for everyone in under a minute.
const { isLoggedIn, readJson } = require("./_auth");

const REPO = "leahcedeno/favs";
const FILE = "overrides.json";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });
  if (!isLoggedIn(req)) return res.status(401).json({ ok: false, error: "Please log in again." });
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(503).json({ ok: false, error: "The GitHub token hasn't been set in Vercel yet." });

  const body = await readJson(req);
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  if (!isObj(body.top) || !isObj(body.order) || !isObj(body.move)) return res.status(400).json({ ok: false, error: "That doesn't look like shop settings." });
  const clean = { top: body.top, order: body.order, move: body.move };
  const text = JSON.stringify(clean, null, 1);
  if (text.length > 200000) return res.status(413).json({ ok: false, error: "Too much data." });

  const api = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
  const headers = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "User-Agent": "favs-admin" };
  try {
    const cur = await fetch(api, { headers });
    if (cur.status === 401 || cur.status === 403) return res.status(502).json({ ok: false, error: "GitHub rejected the saved token. It may have expired." });
    const sha = cur.ok ? (await cur.json()).sha : undefined;
    const put = await fetch(api, {
      method: "PUT", headers,
      body: JSON.stringify({ message: "Update top picks and order from admin mode", content: Buffer.from(text, "utf8").toString("base64"), sha }),
    });
    if (!put.ok) return res.status(502).json({ ok: false, error: "GitHub couldn't save it (error " + put.status + ")." });
    return res.status(200).json({ ok: true });
  } catch (_) {
    return res.status(502).json({ ok: false, error: "Couldn't reach GitHub." });
  }
};
