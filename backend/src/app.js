const express = require("express");
const path = require("node:path");
const multer = require("multer");
const apiRouter = require("./routes/api");
const securityMiddlewares = require("./middlewares/security");

const app = express();

app.disable("x-powered-by");

securityMiddlewares().forEach((middleware) => app.use(middleware));

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/api", apiRouter);

app.use((error, _req, res, _next) => {
  console.error("[API_ERROR]", error.message);

  if (error && error.message === "Origen CORS no permitido") {
    return res.status(403).json({
      message: "Origen no permitido por politica CORS",
    });
  }

  if (error && error.code === "ER_SIGNAL_EXCEPTION") {
    return res.status(409).json({ message: error.sqlMessage });
  }

  if (error && error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Registro duplicado" });
  }

  if (error && error.message === "Solo se permiten archivos de imagen") {
    return res.status(400).json({
      message: "Solo se permiten archivos de imagen",
    });
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Cada imagen debe pesar maximo 5MB",
      });
    }

    return res.status(400).json({
      message: "Error al procesar las imagenes",
      detail: error.message,
    });
  }

  return res.status(500).json({
    message: "Error interno del servidor",
    detail: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = app;
