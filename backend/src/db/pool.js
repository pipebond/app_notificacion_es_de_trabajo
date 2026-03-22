const mysql = require("mysql2/promise");
const fs = require("node:fs");

const connectionUrl =
  process.env.DB_URL || process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;

function parseConnectionUrl(url) {
  if (!url) {
    return {};
  }

  try {
    const parsed = new URL(url);

    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : undefined,
      user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password
        ? decodeURIComponent(parsed.password)
        : undefined,
      database: parsed.pathname
        ? parsed.pathname.replace(/^\//, "")
        : undefined,
    };
  } catch (_error) {
    return {};
  }
}

const fromUrl = parseConnectionUrl(connectionUrl);

const sslCaPath = process.env.DB_SSL_CA;
const sslCaContent = process.env.DB_SSL_CA_CONTENT;
const sslEnabled = process.env.DB_SSL === "true";
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

const resolvedCa = sslCaContent
  ? sslCaContent
  : sslCaPath
    ? fs.readFileSync(sslCaPath, "utf8")
    : undefined;

const sslConfig =
  sslEnabled || resolvedCa
    ? {
        ...(resolvedCa ? { ca: resolvedCa } : {}),
        rejectUnauthorized,
      }
    : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || fromUrl.host || "127.0.0.1",
  port: Number(process.env.DB_PORT || fromUrl.port || 3306),
  user: process.env.DB_USER || fromUrl.user || "root",
  password: process.env.DB_PASSWORD || fromUrl.password || "",
  database: process.env.DB_NAME || fromUrl.database || "work_reports_db",
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  enableKeepAlive: true,
  charset: "utf8mb4",
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
