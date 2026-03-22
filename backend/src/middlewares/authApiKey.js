function authApiKey(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const requiredApiKey = process.env.API_KEY;

  if (!requiredApiKey) {
    return res.status(500).json({
      message: "API_KEY no esta configurada en el servidor",
    });
  }

  const providedApiKey = req.header("x-api-key");

  if (!providedApiKey || providedApiKey !== requiredApiKey) {
    return res.status(401).json({
      message: "No autorizado",
    });
  }

  return next();
}

module.exports = authApiKey;
