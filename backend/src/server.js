require("dotenv").config();

const app = require("./app");
const pool = require("./db/pool");
const ensureSchema = require("./db/ensureSchema");

const PORT = Number(process.env.PORT || 4000);

function validateEnvironment() {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.error("Falta variable requerida JWT_SECRET en produccion");
      process.exit(1);
    }

    process.env.JWT_SECRET = "dev_jwt_secret_change_me";
    console.warn(
      "JWT_SECRET no definido. Usando secreto temporal de desarrollo. Configura JWT_SECRET para despliegues reales.",
    );
  }

  const hasDbUrl = Boolean(
    process.env.DB_URL || process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL,
  );

  const required = hasDbUrl
    ? ["API_KEY"]
    : ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "API_KEY"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(`Faltan variables requeridas en .env: ${missing.join(", ")}`);
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const sslEnabled = process.env.DB_SSL === "true";
  const hasSslCa = Boolean(
    process.env.DB_SSL_CA || process.env.DB_SSL_CA_CONTENT,
  );
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

  if (isProduction && sslEnabled && !hasSslCa && rejectUnauthorized) {
    console.warn(
      "DB_SSL activo sin CA configurada. Define DB_SSL_CA_CONTENT o usa DB_SSL_REJECT_UNAUTHORIZED=false segun tu proveedor.",
    );
  }
}

async function bootstrap() {
  try {
    validateEnvironment();
    await ensureSchema();
    await pool.query("SELECT 1");
    app.listen(PORT, () => {
      console.log(`Backend escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "No fue posible inicializar MySQL. Revisa la configuracion y el esquema.",
    );
    console.error(error.message);
    process.exit(1);
  }
}

bootstrap();
