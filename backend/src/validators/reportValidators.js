const { body } = require("express-validator");

const createReportValidator = [
  body("bossId").isInt({ min: 1 }).withMessage("bossId invalido"),
  body("employeeId").isInt({ min: 1 }).withMessage("employeeId invalido"),
  body("observations")
    .trim()
    .isLength({ min: 3, max: 5000 })
    .withMessage("observations debe tener entre 3 y 5000 caracteres"),
  body("workDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601({ strict: true })
    .withMessage("workDate debe tener formato YYYY-MM-DD"),
  body("imageUrls")
    .optional()
    .customSanitizer((value) => {
      if (!Array.isArray(value)) {
        return [];
      }

      return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => /^https?:\/\//i.test(item));
    })
    .isArray({ max: 10 })
    .withMessage("imageUrls debe ser un arreglo con maximo 10 items"),
];

module.exports = {
  createReportValidator,
};
