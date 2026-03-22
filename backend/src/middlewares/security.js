const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

function parseOrigins(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);
const isProduction = process.env.NODE_ENV === "production";

const corsMiddleware = cors({
  origin(origin, callback) {
    // En desarrollo permitimos cualquier origen para facilitar Flutter web
    // con puertos dinámicos; en producción se exige whitelist explícita.
    if (!isProduction) {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origen CORS no permitido"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "x-api-key"],
});

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta mas tarde." },
});

function securityMiddlewares() {
  return [
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
    corsMiddleware,
    hpp(),
    apiLimiter,
  ];
}

module.exports = securityMiddlewares;
