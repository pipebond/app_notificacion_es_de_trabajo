const { body } = require("express-validator");

const createEmployeeValidator = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 140 })
    .withMessage("fullName debe tener entre 2 y 140 caracteres"),
  body("idNumber")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("idNumber debe tener entre 3 y 50 caracteres"),
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
];

module.exports = {
  createEmployeeValidator,
};
