const pool = require("../db/pool");

async function createBoss(req, res, next) {
  try {
    const {
      name,
      companyName,
      accessCode,
      position,
      phone,
      email,
      notes,
      plan = "FREE",
    } = req.body;

    if (!name || !position) {
      return res.status(400).json({
        message: "name y position son obligatorios",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO bosses (name, company_name, access_code, position, phone, email, notes, plan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        companyName || null,
        accessCode || null,
        position,
        phone || null,
        email || null,
        notes || null,
        plan,
      ],
    );

    return res.status(201).json({
      id: result.insertId,
      message: "Jefe creado correctamente",
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBoss(req, res, next) {
  try {
    const bossId = Number(req.params.bossId);
    const {
      name,
      companyName,
      accessCode,
      position,
      phone,
      email,
      notes,
      plan = "FREE",
    } = req.body;

    const [result] = await pool.execute(
      `UPDATE bosses
       SET name = ?,
           company_name = ?,
           access_code = ?,
           position = ?,
           phone = ?,
           email = ?,
           notes = ?,
           plan = ?
       WHERE id = ?`,
      [
        name,
        companyName || null,
        accessCode || null,
        position,
        phone || null,
        email || null,
        notes || null,
        plan,
        bossId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Jefe no encontrado" });
    }

    return res.json({
      id: bossId,
      message: "Jefe actualizado correctamente",
    });
  } catch (error) {
    return next(error);
  }
}

async function getBossById(req, res, next) {
  try {
    const bossId = Number(req.params.bossId);

    const [rows] = await pool.execute("SELECT * FROM bosses WHERE id = ?", [
      bossId,
    ]);

    if (!rows.length) {
      return res.status(404).json({ message: "Jefe no encontrado" });
    }

    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
}

async function getBossByAccessCode(req, res, next) {
  try {
    const accessCode = req.params.accessCode;

    const [rows] = await pool.execute(
      `SELECT id, name, company_name, access_code, position, phone, email, notes, plan, created_at
       FROM bosses
       WHERE access_code = ?`,
      [accessCode],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "ID de empresa no encontrado" });
    }

    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBoss,
  updateBoss,
  getBossById,
  getBossByAccessCode,
};
