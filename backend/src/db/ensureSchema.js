const pool = require("./pool");

async function getDatabaseName() {
  const [rows] = await pool.query("SELECT DATABASE() AS name");
  return rows[0]?.name || null;
}

async function ensureBossColumns(databaseName) {
  const [companyColumnRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'bosses'
       AND COLUMN_NAME = 'company_name'`,
    [databaseName],
  );

  if (Number(companyColumnRows[0]?.total || 0) === 0) {
    await pool.query(
      "ALTER TABLE bosses ADD COLUMN company_name VARCHAR(180) NULL AFTER name",
    );
  }

  const [accessColumnRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'bosses'
       AND COLUMN_NAME = 'access_code'`,
    [databaseName],
  );

  if (Number(accessColumnRows[0]?.total || 0) === 0) {
    await pool.query(
      "ALTER TABLE bosses ADD COLUMN access_code VARCHAR(40) NULL AFTER company_name",
    );
  }

  const [accessIndexRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'bosses'
       AND INDEX_NAME = 'uq_boss_access_code'`,
    [databaseName],
  );

  if (Number(accessIndexRows[0]?.total || 0) === 0) {
    await pool.query(
      "ALTER TABLE bosses ADD UNIQUE KEY uq_boss_access_code (access_code)",
    );
  }
}

async function ensureFreePlanTrigger(databaseName) {
  const [triggerRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.TRIGGERS
     WHERE TRIGGER_SCHEMA = ?
       AND TRIGGER_NAME = 'trg_limit_free_employees'`,
    [databaseName],
  );

  if (Number(triggerRows[0]?.total || 0) > 0) {
    await pool.query("DROP TRIGGER trg_limit_free_employees");
  }

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

  await pool.query(triggerSql);
}

async function ensureSchema() {
  const databaseName = await getDatabaseName();

  if (!databaseName) {
    throw new Error("No se pudo identificar la base de datos activa");
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS bosses (
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
    ) ENGINE=InnoDB`,
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS employees (
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
    ) ENGINE=InnoDB`,
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS reports (
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
    ) ENGINE=InnoDB`,
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS report_images (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      report_id INT UNSIGNED NOT NULL,
      image_url VARCHAR(1024) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_report_image_report
        FOREIGN KEY (report_id)
        REFERENCES reports(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB`,
  );

  await ensureBossColumns(databaseName);
  await ensureFreePlanTrigger(databaseName);
}

module.exports = ensureSchema;
