const express = require("express");
const componentController = require("../controller/component.controller.js");
const JWT = require("../middleware/jwt.js");
const Router = express.Router();
const multer = require("multer");
const { uploadToCloud } = require("../utils/cloudinary");
const asyncWrapper = require("../middleware/asyncWrapper");
const Member = require("../mongoose.models/member");
const createError = require("../utils/createError");

const OC_validate=asyncWrapper(async (req, res, next) => {
    const email=req.decoded.email;
    const  member= await Member.findOne({email});
    

    if (member.committee !== "OC" && member.role !== "leader") {
        const error=createError(403, 'Fail',"this operation is only for OC")
        throw(error);
        return;
    }
    next();
})

// Multer configuration
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save locally before uploading to Cloudinary
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        const filename = `${file.originalname.split(".")[0]}_${Date.now()}.${ext}`;
        req.myFileName = filename;
        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    const imageType = file.mimetype.split("/")[1];
    if (imageType === "jpg" || imageType === "jpeg" || imageType === "png") {
        return cb(null, true); // Only allow JPG and PNG files
    } else {
        return cb(new Error("Only images (jpg, jpeg, png) are allowed!"), false);
    }
};

// Multer middleware
const upload = multer({
    storage: diskStorage,
    fileFilter,
});

// Cloudinary image upload route
Router.route("/add").post(
    upload.single("image"),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }

            // Upload image to Cloudinary using the utility function
            const imageUrl = await uploadToCloud(req.file.path); // Passing the file path to Cloudinary
            req.imageUrl = imageUrl;
            next()
            //     res.status(200).json({
            //         message: 'Image uploaded successfully!',
            //         url: imageUrl, // Cloudinary URL of the uploaded image
            //     });
        } catch (error) {
            res.status(500).json({ message: 'Error uploading image', error });
        }
    },
    componentController.addComponent
);
Router.route("/getComponents").get(componentController.getCombonent);

Router.route("/update").post(JWT.verify,OC_validate,componentController.updateComponent);

Router.route("/deleteOne").post(JWT.verify,OC_validate,componentController.deleteOne);

// Routes for borrowing and returning components
// Router.route("/borrow").post(JWT.verify,OC_validate,componentController.borrowComponent);
Router.route("/return").post(JWT.verify,OC_validate,componentController.returnComponent);

// Routes for requested and borrowed components
Router.route("/requestToBorrow").post(JWT.verify,componentController.requestToBorrow);
Router.route("/acceptRequestToBorrow").post(JWT.verify,OC_validate,componentController.acceptRequestToBorrow);
Router.route("/rejectRequestToBorrow").post(JWT.verify,OC_validate,componentController.rejectRequestToBorrow);
Router.route("/getRequestedComponent").get(JWT.verify,OC_validate,componentController.getRequestedComponent);
Router.route("/getBorrowedComponent").get(JWT.verify,OC_validate,componentController.getBorrowedComponent);
Router.route("/getHistoryComponent").get(JWT.verify,OC_validate,componentController.getHistoryComponent);
Router.route("/getDeletedComponent").get(componentController.getDeletedComponent);


module.exports = Router;