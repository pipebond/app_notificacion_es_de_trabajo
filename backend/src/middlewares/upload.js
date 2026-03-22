const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");

const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeExtension = extension || ".jpg";
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    callback(null, fileName);
  },
});

function imageFilter(_req, file, callback) {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(new Error("Solo se permiten archivos de imagen"));
}

const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

module.exports = {
  uploadImages,
};
