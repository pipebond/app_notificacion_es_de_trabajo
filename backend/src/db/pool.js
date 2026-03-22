const mysql = require("mysql2/promise");
const fs = require("node:fs");

const sslCaPath = process.env.DB_SSL_CA;
const sslCaContent = process.env.DB_SSL_CA_CONTENT;
const sslEnabled = process.env.DB_SSL === "true";
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

const resolvedCa = sslCaContent
  ? sslCaContent
  : sslCaPath
    ? fs.readFileSync(sslCaPath, "utf8")
    : undefined;

const sslConfig = sslEnabled || resolvedCa
  ? {
      ...(resolvedCa ? { ca: resolvedCa } : {}),
      rejectUnauthorized,
    }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "work_reports_db",
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  enableKeepAlive: true,
  charset: "utf8mb4",
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
