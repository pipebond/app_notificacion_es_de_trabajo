const mysql = require("mysql2/promise");

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  const schemaSql = `
    CREATE DATABASE IF NOT EXISTS work_reports_db
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;

    USE work_reports_db;

    CREATE TABLE IF NOT EXISTS bosses (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      company_name VARCHAR(180) NULL,
      access_code VARCHAR(40) NULL,
      position VARCHAR(120) NOT NULL,
      phone VARCHAR(30) NULL,
      email VARCHAR(180) NULL,
      notes TEXT NULL,
      plan ENUM('FREE', 'PAID') NOT NULL DEFAULT 'FREE',
      UNIQUE KEY uq_boss_access_code (access_code),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS employees (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      boss_id INT UNSIGNED NOT NULL,
      full_name VARCHAR(140) NOT NULL,
      id_number VARCHAR(50) NOT NULL,
      phone VARCHAR(30) NULL,
      email VARCHAR(180) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_employee_per_boss (boss_id, id_number),
      CONSTRAINT fk_employee_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS reports (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      boss_id INT UNSIGNED NOT NULL,
      employee_id INT UNSIGNED NOT NULL,
      observations TEXT NOT NULL,
      work_date DATE NOT NULL DEFAULT (CURRENT_DATE),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_report_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
      CONSTRAINT fk_report_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS report_images (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      report_id INT UNSIGNED NOT NULL,
      image_url VARCHAR(1024) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_report_image_report
        FOREIGN KEY (report_id)
        REFERENCES reports(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  await connection.query(schemaSql);
  await connection.query("USE work_reports_db");
  const [columnRows] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'bosses'
       AND COLUMN_NAME = 'company_name'`,
  );

  const columnExists = Number(columnRows[0]?.total || 0) > 0;
  if (!columnExists) {
    await connection.query(
      "ALTER TABLE bosses ADD COLUMN company_name VARCHAR(180) NULL AFTER name",
    );
  }

  const [accessColumnRows] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'bosses'
       AND COLUMN_NAME = 'access_code'`,
  );

  const accessColumnExists = Number(accessColumnRows[0]?.total || 0) > 0;
  if (!accessColumnExists) {
    await connection.query(
      "ALTER TABLE bosses ADD COLUMN access_code VARCHAR(40) NULL AFTER company_name",
    );
  }

  const [accessIndexRows] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'bosses'
       AND INDEX_NAME = 'uq_boss_access_code'`,
  );

  const accessIndexExists = Number(accessIndexRows[0]?.total || 0) > 0;
  if (!accessIndexExists) {
    await connection.query(
      "ALTER TABLE bosses ADD UNIQUE KEY uq_boss_access_code (access_code)",
    );
  }

  await connection.query("DROP TRIGGER IF EXISTS trg_limit_free_employees");

  const triggerSql = `
    CREATE TRIGGER trg_limit_free_employees
    BEFORE INSERT ON employees
    FOR EACH ROW
    BEGIN
      DECLARE v_plan VARCHAR(10);
      DECLARE v_count INT;

      SELECT plan INTO v_plan
      FROM bosses
      WHERE id = NEW.boss_id;

      IF v_plan = 'FREE' THEN
        SELECT COUNT(*) INTO v_count
        FROM employees
        WHERE boss_id = NEW.boss_id;

        IF v_count >= 5 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Limite de 5 empleados alcanzado para plan FREE';
        END IF;
      END IF;
    END
  `;

  await connection.query(triggerSql);
  await connection.end();
  console.log("DB_READY");
}

init().catch((error) => {
  console.error("DB_INIT_FAILED");
  console.error(error.message);
  process.exit(1);
});
