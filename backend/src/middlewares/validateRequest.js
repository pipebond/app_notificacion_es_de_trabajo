const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const normalizedErrors = errors.array({ onlyFirstError: true });
    const firstError = normalizedErrors[0];
    const field = firstError?.path || firstError?.param || "campo";
    const detail = firstError?.msg || "valor invalido";

    return res.status(422).json({
      message: `Datos invalidos en ${field}: ${detail}`,
      errors: normalizedErrors,
    });
  }

  return next();
}

module.exports = validateRequest;
