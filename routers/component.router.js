const express = require("express");
const componentController = require("../controller/component.controller.js");
const JWT = require("../middleware/jwt.js");
const Router = express.Router();


// Import middlewares
const upload = require("../middleware/multerConfig");
const handleCloudinaryUpload = require("../middleware/cloudinaryUpload");
const {
    validateRequest,
    componentExists,
    isComponentAvailable,
    isComponentBorrowed,
    isOCMember,
    isLeaderOrOC
  } = require("../middleware/componentMiddleware");


// Cloudinary image upload route
Router.route("/add").post(
    upload.single("image"),
    handleCloudinaryUpload,
    componentController.addComponent
);


Router.route("/getComponents").get(componentController.getComponent);
Router.route("/:id").get(
    componentExists,
    componentController.getComponentById
  );

Router.route("/update").post(JWT.verify, componentExists, isLeaderOrOC, componentController.updateComponent);

Router.route("/deleteOne").post(JWT.verify, componentExists, isLeaderOrOC, componentController.deleteOne);

// Routes for borrowing and returning components
Router.route("/borrow").post(JWT.verify, componentExists, isLeaderOrOC, componentController.borrowComponent);
Router.route("/return").post(JWT.verify, componentExists, isComponentBorrowed, isLeaderOrOC, componentController.returnComponent);

// Routes for requested and borrowed components
Router.route("/requestToBorrow").post(JWT.verify, componentExists, isComponentAvailable, componentController.requestToBorrow);

Router.route("/acceptRequestToBorrow").post(JWT.verify, componentExists, isLeaderOrOC, componentController.acceptRequestToBorrow);
Router.route("/rejectRequestToBorrow").post(JWT.verify, componentExists, isLeaderOrOC, componentController.rejectRequestToBorrow);
Router.route("/getRequestedComponent").get(JWT.verify, isLeaderOrOC, componentController.getRequestedComponent);
Router.route("/getBorrowedComponent").get(JWT.verify, isLeaderOrOC, componentController.getBorrowedComponent);
Router.route("/getHistoryComponent").get(JWT.verify, isLeaderOrOC, componentController.getHistoryComponent);
Router.route("/getDeletedComponent").get(JWT.verify, isLeaderOrOC, componentController.getDeletedComponent);


module.exports = Router;