async function uploadReportImages(req, res) {
  const files = req.files || [];

  if (!files.length) {
    return res.status(400).json({
      message: "Debes enviar al menos una imagen en el campo images",
    });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const imageUrls = files.map((file) => `${baseUrl}/uploads/${file.filename}`);

  return res.status(201).json({
    message: "Imagenes cargadas correctamente",
    imageUrls,
  });
}

module.exports = {
  uploadReportImages,
};
