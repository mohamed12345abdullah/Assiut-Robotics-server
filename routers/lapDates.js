const express = require('express');
const router = express.Router();
const JWT= require('../middleware/jwt');
const { createLapDate, getLapDate } = require('../controller/lap.controller');

router.post('/', JWT.verify, createLapDate);
router.get('/', JWT.verify, getLapDate);

module.exports = router;
