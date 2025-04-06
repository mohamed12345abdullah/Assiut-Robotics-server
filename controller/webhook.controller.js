const handleWebhookPost = (req, res) => {
    try {
      const body = req.body;
      console.log('Received webhook event:', JSON.stringify(body, null, 2));
  
      if (body.object === 'page') {
        body.entry.forEach(entry => {
          console.log('Entry:', JSON.stringify(entry, null, 2));
  
          if (entry.messaging) {
            entry.messaging.forEach(event => {
              if (event.message && event.message.text) {
                console.log('Received message:', event.message.text);
                // Process/save message to DB here
              }
  
              if (event.reaction) {
                console.log('Received reaction:', event.reaction);
                // Process/save reaction here
              }
  
              if (event.comment) {
                console.log('Received comment:', event.comment);
                // Process/save comment here
              }
            });
          }
        });
  
        return res.status(200).send('EVENT_RECEIVED');
      } else {
        return res.status(404).send('Not a page event');
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).send('Error processing webhook');
    }
  };
  
  module.exports = {
    handleWebhookPost,
  };
  