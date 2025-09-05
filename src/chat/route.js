const express = require('express');
const router = express.Router();
router.post('/', async (req, res) => {
  const { messages } = req.body;
  const lastMessage = messages[messages.length - 1];
  res.status(200).json({
    message: `This is a mock response to your message: "${lastMessage.content}"`,
  });
});

module.exports = router;
