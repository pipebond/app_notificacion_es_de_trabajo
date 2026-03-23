const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

function normalizeRole(role) {
  return role === "boss" ? "boss" : "employee";
}

function signSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      bossId: user.boss_id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "reportapro",
      audience: "reportapro-web",
    },
  );
}

function mapUserResponse(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    bossId: user.boss_id,
    companyName: user.company_name,
    dataAuthorized: Boolean(user.data_authorized),
  };
}

async function resolveBossForRegister(connection, payload) {
  const role = normalizeRole(payload.role);
  const accessCode = payload.accessCode;

  if (role === "boss") {
    if (!payload.companyName || !payload.position) {
      throw new Error("Como jefe debes incluir companyName y position");
    }

    const [existingBossRows] = await connection.execute(
      `SELECT id, company_name
       FROM bosses
       WHERE access_code = ?
       LIMIT 1`,
      [accessCode],
    );

    if (existingBossRows.length) {
      const boss = existingBossRows[0];
      await connection.execute(
        `UPDATE bosses
         SET name = ?,
             company_name = ?,
             position = ?,
             email = ?,
             notes = ?
         WHERE id = ?`,
        [
          payload.fullName,
          payload.companyName,
          payload.position,
          payload.email,
          "Cuenta creada desde autenticacion backend",
          boss.id,
        ],
      );

      return {
        bossId: boss.id,
        companyName: payload.companyName,
      };
    }

    const [result] = await connection.execute(
      `INSERT INTO bosses (name, company_name, access_code, position, phone, email, notes, plan)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'FREE')`,
      [
        payload.fullName,
        payload.companyName,
        accessCode,
        payload.position,
        null,
        payload.email,
        "Cuenta creada desde autenticacion backend",
      ],
    );

    return {
      bossId: result.insertId,
      companyName: payload.companyName,
    };
  }

  const [bossRows] = await connection.execute(
    `SELECT id, company_name
     FROM bosses
     WHERE access_code = ?
     LIMIT 1`,
    [accessCode],
  );

  if (!bossRows.length) {
    throw new Error("ID de empresa no encontrado");
  }

  return {
    bossId: bossRows[0].id,
    companyName: bossRows[0].company_name || "",
  };
}

async function register(req, res, next) {
  let connection;

  try {
    const payload = {
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      role: normalizeRole(req.body.role),
      companyName: req.body.companyName || "",
      accessCode: req.body.accessCode,
      position: req.body.position || "",
      dataAuthorized: Boolean(req.body.dataAuthorized),
    };

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `SELECT id
       FROM app_users
       WHERE email = ? AND role = ?
       LIMIT 1`,
      [payload.email, payload.role],
    );

    if (existingRows.length) {
      await connection.rollback();
      return res.status(409).json({
        message: "Ese correo ya esta registrado para el rol indicado",
      });
    }

    const bossContext = await resolveBossForRegister(connection, payload);
    const passwordHash = await bcrypt.hash(payload.password, 12);

    const [userResult] = await connection.execute(
      `INSERT INTO app_users (
         full_name, email, password_hash, role, boss_id, company_name, data_authorized
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.fullName,
        payload.email,
        passwordHash,
        payload.role,
        bossContext.bossId,
        bossContext.companyName,
        payload.dataAuthorized ? 1 : 0,
      ],
    );

    await connection.commit();

    return res.status(201).json({
      id: userResult.insertId,
      message: "Cuenta creada correctamente",
      user: {
        id: userResult.insertId,
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        bossId: bossContext.bossId,
        companyName: bossContext.companyName,
        dataAuthorized: payload.dataAuthorized,
      },
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

async function login(req, res, next) {
  try {
    const email = req.body.email;
    const role = normalizeRole(req.body.role);
    const password = req.body.password;

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash, role, boss_id, company_name, data_authorized
       FROM app_users
       WHERE email = ? AND role = ?
       LIMIT 1`,
      [email, role],
    );

    if (!rows.length) {
      return res
        .status(401)
        .json({ message: "Credenciales o rol incorrectos" });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res
        .status(401)
        .json({ message: "Credenciales o rol incorrectos" });
    }

    const token = signSessionToken(user);

    return res.json({
      message: "Sesion iniciada correctamente",
      token,
      user: mapUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function getSession(req, res, next) {
  try {
    const userId = Number(req.sessionUser?.sub || 0);
    if (!userId) {
      return res.status(401).json({ message: "Sesion invalida" });
    }

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, role, boss_id, company_name, data_authorized
       FROM app_users
       WHERE id = ?
       LIMIT 1`,
      [userId],
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Sesion no encontrada" });
    }

    return res.json({
      user: mapUserResponse(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  getSession,
};
