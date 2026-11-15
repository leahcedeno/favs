// GET: is this browser logged in to admin? POST: log out.
const { isLoggedIn, clearCookie } = require("./_auth");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "POST") { res.setHeader("Set-Cookie", clearCookie()); return res.status(200).json({ ok: true }); }
  return res.status(200).json({ ok: isLoggedIn(req) });
};
