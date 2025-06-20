const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const { uploadToCloud } = require("../utils/cloudinary");
const fs = require("fs");
const path = require("path");

// Configure Cloudinary
cloudinary.config({
    cloud_name: "dlxwpay7b",
    secure: true,
    api_key: "957197717412299",
    api_secret: "Pv53x9A3EkgBa3b_1H7O1Wu_sWc"
});

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter for images
const imageFileFilter = (req, file, cb) => {
    const imageType = file.mimetype.split("/")[0];
    if (imageType === "image") {
        return cb(null, true);
    } else {
        return cb(new Error("Only image files are allowed!"), false);
    }
};

// File filter for all files
const allFileFilter = (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/zip', 'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        return cb(null, true);
    } else {
        return cb(new Error("File type not allowed!"), false);
    }
};

// Create multer instances
const uploadImage = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for images
    }
});

const uploadFile = multer({
    storage: storage,
    fileFilter: allFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for files
    }
});

// Middleware for uploading image to Cloudinary
const uploadImageToCloudinary = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                status: 'FAIL', 
                message: 'No file uploaded' 
            });
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto',
            transformation: {
                fetch_format: "auto",
                quality: "auto",
                width: 1200,
                height: 1200,
                crop: "fill"
            }
        });

        req.imageUrl = result.secure_url;
        req.publicId = result.public_id;
        next();
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ 
            status: 'ERROR', 
            message: 'Failed to upload image to Cloudinary',
            error: error.message 
        });
    }
};

// Middleware for uploading any file to Cloudinary
const uploadFileToCloudinary = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                status: 'FAIL', 
                message: 'No file uploaded' 
            });
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto'
        });

        req.fileUrl = result.secure_url;
        req.publicId = result.public_id;
        req.fileType = req.file.mimetype;
        req.fileName = req.file.originalname;
        next();
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ 
            status: 'ERROR', 
            message: 'Failed to upload file to Cloudinary',
            error: error.message 
        });
    }
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        return true;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return false;
    }
};

module.exports = {
    uploadImage,
    uploadFile,
    uploadImageToCloudinary,
    uploadFileToCloudinary,
    deleteFromCloudinary
}; 