
const express = require("express");
const router = express.Router();
const controller = require("../controller/guest.controller");


router.route('/')
.post(controller.viewUser)
.get(controller.getViews);



module.exports = router;