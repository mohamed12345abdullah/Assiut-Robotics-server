const multer = require("multer");
const path = require("path");
const createError = require("../utils/createError");

// Configure storage
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `comp_${Date.now()}${ext}`;
        req.generatedFilename = filename; // Attach to request for cleanup if needed
        cb(null, filename);
    }
});

// File filter configuration
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(createError(400, "Fail", "Only JPG, JPEG, and PNG images are allowed"), false);
    }
    
    if (file.size > maxSize) {
        return cb(createError(400, "Fail", "File size must be less than 5MB"), false);
    }
    
    cb(null, true);
};

// Create configured multer instance
const upload = multer({
    storage: diskStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

module.exports = upload;