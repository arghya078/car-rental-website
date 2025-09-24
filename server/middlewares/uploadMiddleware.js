const multer = require("multer");
const path = require("path");

// Use memory storage (keeps files in RAM, not disk)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedExts = [".jpeg", ".jpg", ".png", ".pdf"];
  const allowedMimes = ["image/jpeg", "image/png", "application/pdf"];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedExts.includes(ext) && allowedMimes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpeg, .jpg, .png, .pdf files are allowed!"), false);
  }
};

// Configure multer
const upload = multer({
  storage, // memory storage
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter,
});

module.exports = upload;
