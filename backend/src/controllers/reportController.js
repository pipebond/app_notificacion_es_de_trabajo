const pool = require("../db/pool");

async function createReport(req, res, next) {
  let connection;

  try {
    connection = await pool.getConnection();
    const {
      bossId,
      employeeId,
      observations,
      workDate,
      imageUrls = [],
    } = req.body;

    await connection.beginTransaction();

    const [employeeRows] = await connection.execute(
      "SELECT id FROM employees WHERE id = ? AND boss_id = ?",
      [Number(employeeId), Number(bossId)],
    );

    if (!employeeRows.length) {
      await connection.rollback();
      return res.status(404).json({
        message: "El empleado no pertenece al jefe indicado",
      });
    }

    const [result] = await connection.execute(
      `INSERT INTO reports (boss_id, employee_id, observations, work_date)
       VALUES (?, ?, ?, COALESCE(?, CURDATE()))`,
      [Number(bossId), Number(employeeId), observations, workDate || null],
    );

    const reportId = result.insertId;

    if (Array.isArray(imageUrls) && imageUrls.length) {
      const values = imageUrls
        .filter((url) => typeof url === "string" && url.trim() !== "")
        .map((url) => url.trim())
        .filter((url) => /^https?:\/\//i.test(url))
        .map((url) => [reportId, url]);

      if (values.length) {
        await connection.query(
          "INSERT INTO report_images (report_id, image_url) VALUES ?",
          [values],
        );
      }
    }

    await connection.commit();

    return res.status(201).json({
      id: reportId,
      message: "Reporte creado correctamente",
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

async function listReportsByBoss(req, res, next) {
  try {
    const bossId = Number(req.params.bossId);

    const [rows] = await pool.execute(
      `SELECT r.id, r.boss_id, r.employee_id, e.full_name AS employee_name,
              r.observations, r.work_date, r.created_at,
              GROUP_CONCAT(ri.image_url ORDER BY ri.id SEPARATOR '||') AS images
       FROM reports r
       INNER JOIN employees e ON e.id = r.employee_id
       LEFT JOIN report_images ri ON ri.report_id = r.id
       WHERE r.boss_id = ?
       GROUP BY r.id, r.boss_id, r.employee_id, e.full_name, r.observations, r.work_date, r.created_at
       ORDER BY r.created_at DESC`,
      [bossId],
    );

    const normalized = rows.map((row) => ({
      ...row,
      images: row.images ? row.images.split("||") : [],
    }));

    return res.json(normalized);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createReport,
  listReportsByBoss,
};
