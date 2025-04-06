const VERIFY_TOKEN = "assiut_robotics_123";

function verifyWebhook(req, res, next) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  res.status(400).json({
    status: 400,
    data: { mode, token, challenge },
    message: "Invalid parameters",
  });
}

module.exports = verifyWebhook;
