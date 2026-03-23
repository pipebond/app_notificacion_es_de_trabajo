const { body } = require("express-validator");

const registerValidator = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("fullName debe tener entre 2 y 120 caracteres"),
  body("email").trim().isEmail().withMessage("email invalido").normalizeEmail(),
  body("password")
    .isLength({ min: 6, max: 120 })
    .withMessage("password debe tener entre 6 y 120 caracteres"),
  body("role")
    .isIn(["boss", "employee"])
    .withMessage("role debe ser boss o employee"),
  body("companyName")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 180 })
    .withMessage("companyName debe tener entre 2 y 180 caracteres"),
  body("accessCode")
    .trim()
    .isLength({ min: 4, max: 40 })
    .withMessage("accessCode debe tener entre 4 y 40 caracteres")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage("accessCode solo permite letras, numeros, guion y guion bajo"),
  body("position")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("position debe tener entre 2 y 120 caracteres"),
  body("dataAuthorized")
    .isBoolean()
    .withMessage("dataAuthorized debe ser boolean"),
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("email invalido").normalizeEmail(),
  body("password")
    .isLength({ min: 6, max: 120 })
    .withMessage("password debe tener entre 6 y 120 caracteres"),
  body("role")
    .isIn(["boss", "employee"])
    .withMessage("role debe ser boss o employee"),
];

module.exports = {
  registerValidator,
  loginValidator,
};
