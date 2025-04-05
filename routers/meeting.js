const meetingController = require("../controller/meeting");

const express = require("express");
const   jwt = require("../middleware/jwt");
const router = express.Router();

router.post("/", jwt.verify, meetingController.createMeeting);
router.get("/", jwt.verify, meetingController.getMeetings);
router.get("/:id", jwt.verify, meetingController.getMeetingById);
router.post("/:meetingId/book",jwt.verify, meetingController.bookMeeting);

module.exports = router;
