const express = require('express');
const router = express.Router();
const verifyWebhook = require('../middleware/verifyWebhook');
const { handleWebhookPost } = require('../controller/webhook.controller');

// Facebook GET webhook verification
router.get('/', verifyWebhook);

// Facebook POST webhook
router.post('/', handleWebhookPost);

module.exports = router;
