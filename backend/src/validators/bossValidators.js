const { body, param } = require("express-validator");

const createBossValidator = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("name debe tener entre 2 y 120 caracteres"),
  body("companyName")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 180 })
    .withMessage("companyName debe tener entre 2 y 180 caracteres"),
  body("accessCode")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 4, max: 40 })
    .withMessage("accessCode debe tener entre 4 y 40 caracteres")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("accessCode solo permite letras, numeros, guion y guion bajo"),
  body("position")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("position debe tener entre 2 y 120 caracteres"),
  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("phone debe tener maximo 30 caracteres"),
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("email invalido")
    .normalizeEmail(),
  body("notes")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("notes excede el maximo de 2000 caracteres"),
  body("plan")
    .optional()
    .isIn(["FREE", "PAID"])
    .withMessage("plan debe ser FREE o PAID"),
];

const bossIdParamValidator = [
  param("bossId").isInt({ min: 1 }).withMessage("bossId invalido"),
];

const accessCodeParamValidator = [
  param("accessCode")
    .trim()
    .isLength({ min: 4, max: 40 })
    .withMessage("accessCode invalido"),
];

module.exports = {
  createBossValidator,
  bossIdParamValidator,
  accessCodeParamValidator,
};
