const jwt = require("jsonwebtoken");

function authSession(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Sesion invalida o ausente" });
  }

  const token = header.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.sessionUser = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Sesion expirada o invalida" });
  }
}

module.exports = authSession;
