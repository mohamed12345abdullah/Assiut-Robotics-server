const express = require("express");

const Router = express.Router();

const announcementController = require("../controller/announcement.controller");

Router.route("/add").post(announcementController.addAnnouncement);

Router.route("/getAnnouncements")
        .get(announcementController.getAnnouncements);


Router.route("/:id")
        .delete(announcementController.deleteAnnouncement)
        .put(announcementController.updateAnnouncement);



module.exports = Router;