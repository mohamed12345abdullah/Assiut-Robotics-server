const asyncWrapper = require("./asyncWrapper");
const createError = require("../utils/createError");
const { uploadToCloud } = require("../utils/cloudinary");
const fs = require("fs");
const path = require("path");

const handleCloudinaryUpload = asyncWrapper(async (req, res, next) => {
    // Validate file exists
    if (!req.file) {
        throw createError(400, 'Fail', 'No file uploaded');
    }

    try {
        // Upload to Cloudinary
        const imageUrl = await uploadToCloud(req.file.path);
        
        // Attach URL to request
        req.imageUrl = imageUrl;
        
        // Cleanup: Delete temporary file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Failed to delete temp file:", err);
        });
        
        next();
    } catch (error) {
        // Cleanup if upload fails
        if (req.file?.path) {
            fs.unlink(req.file.path, () => {});
        }
        throw createError(500, 'Error', 'Failed to upload image to Cloudinary');
    }
});

module.exports = handleCloudinaryUpload;