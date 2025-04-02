const express = require("express");

const Router = express.Router();

const announcementController = require("../controller/announcement.controller");

const jwt = require("../middleware/jwt");
Router.route("/add").post(jwt.verify,announcementController.addAnnouncement);

Router.route("/getAnnouncements")
        .get(announcementController.getAnnouncements);


Router.route("/:id")
        .delete(announcementController.deleteAnnouncement)
        .put(announcementController.updateAnnouncement);



module.exports = Router;