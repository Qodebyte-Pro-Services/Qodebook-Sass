const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.error("🚨 Multer upload error");
  console.error("➡️ Route:", req.method, req.originalUrl);
  console.error("➡️ Field:", file.fieldname);
  console.error("➡️ Mime:", file.mimetype);

  const allowedDocs = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  
  if (file.fieldname === "receipt") {
    if (file.mimetype.startsWith("image/") || allowedDocs.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Receipt must be an image, PDF, or Word document!"), false);
  }

  
  if (file.fieldname === "logo") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Logo must be an image file!"), false);
  }

  
  if (file.fieldname === "photo") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Photo must be an image file (jpg, png, etc.)!"), false);
  }

  
  if (["file", "documents"].includes(file.fieldname)) {
    if (file.mimetype.startsWith("image/") || allowedDocs.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Documents must be images, PDFs, or Word files!"), false);
  }

  if (file.fieldname === "image_url") {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  return cb(new Error("image_url must be an image file!"), false);
}
    console.error("❌ Unexpected field:", file.fieldname);  
  return cb(new Error(`Unexpected field: ${file.fieldname}`), false);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
