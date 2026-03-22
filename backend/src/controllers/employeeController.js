const pool = require("../db/pool");

async function createEmployee(req, res, next) {
  let connection;

  try {
    connection = await pool.getConnection();
    const bossId = Number(req.params.bossId);
    const { fullName, idNumber, phone, email } = req.body;

    await connection.beginTransaction();

    const [bossRows] = await connection.execute(
      "SELECT id, plan FROM bosses WHERE id = ? FOR UPDATE",
      [bossId],
    );

    if (!bossRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Jefe no encontrado" });
    }

    const [existingEmployeeRows] = await connection.execute(
      "SELECT id FROM employees WHERE boss_id = ? AND id_number = ? FOR UPDATE",
      [bossId, idNumber],
    );

    const existingEmployeeId = existingEmployeeRows[0]?.id || null;

    const plan = bossRows[0].plan;

    if (!existingEmployeeId) {
      const [countRows] = await connection.execute(
        "SELECT COUNT(*) AS total FROM employees WHERE boss_id = ?",
        [bossId],
      );

      const total = countRows[0].total;

      if (plan === "FREE" && total >= 5) {
        await connection.rollback();
        return res.status(409).json({
          message:
            "Limite de 5 empleados alcanzado para plan FREE. Debe pagar para agregar mas.",
        });
      }
    }

    const [result] = await connection.execute(
      `INSERT INTO employees (boss_id, full_name, id_number, phone, email)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         id = LAST_INSERT_ID(id),
         full_name = VALUES(full_name),
         phone = VALUES(phone),
         email = VALUES(email)`,
      [bossId, fullName, idNumber, phone || null, email || null],
    );

    await connection.commit();

    return res.status(201).json({
      id: result.insertId || existingEmployeeId,
      message: "Empleado guardado correctamente",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function listEmployeesByBoss(req, res, next) {
  try {
    const bossId = Number(req.params.bossId);

    const [rows] = await pool.execute(
      `SELECT id, boss_id, full_name, id_number, phone, email, created_at
       FROM employees
       WHERE boss_id = ?
       ORDER BY created_at DESC`,
      [bossId],
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createEmployee,
  listEmployeesByBoss,
};
