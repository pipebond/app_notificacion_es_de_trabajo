const express = require("express");
const {
  createBoss,
  getBossById,
  getBossByAccessCode,
  updateBoss,
} = require("../controllers/bossController");
const {
  createEmployee,
  listEmployeesByBoss,
} = require("../controllers/employeeController");
const {
  createReport,
  listReportsByBoss,
} = require("../controllers/reportController");
const { uploadReportImages } = require("../controllers/uploadController");
const authApiKey = require("../middlewares/authApiKey");
const { uploadImages } = require("../middlewares/upload");
const validateRequest = require("../middlewares/validateRequest");
const {
  createBossValidator,
  bossIdParamValidator,
  accessCodeParamValidator,
} = require("../validators/bossValidators");
const { createEmployeeValidator } = require("../validators/employeeValidators");
const { createReportValidator } = require("../validators/reportValidators");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend-app-notificacion" });
});

router.use(authApiKey);

router.post("/bosses", createBossValidator, validateRequest, createBoss);
router.put(
  "/bosses/:bossId",
  bossIdParamValidator,
  createBossValidator,
  validateRequest,
  updateBoss,
);
router.get(
  "/bosses/:bossId",
  bossIdParamValidator,
  validateRequest,
  getBossById,
);
router.get(
  "/bosses/by-access/:accessCode",
  accessCodeParamValidator,
  validateRequest,
  getBossByAccessCode,
);

router.post(
  "/bosses/:bossId/employees",
  bossIdParamValidator,
  createEmployeeValidator,
  validateRequest,
  createEmployee,
);
router.get(
  "/bosses/:bossId/employees",
  bossIdParamValidator,
  validateRequest,
  listEmployeesByBoss,
);

router.post("/reports", createReportValidator, validateRequest, createReport);
router.post("/uploads", uploadImages.array("images", 5), uploadReportImages);
router.get(
  "/bosses/:bossId/reports",
  bossIdParamValidator,
  validateRequest,
  listReportsByBoss,
);

module.exports = router;
