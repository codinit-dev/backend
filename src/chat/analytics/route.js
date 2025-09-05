const express = require('express');
const router = express.Router();
const { ChatPersistence } = require('../../lib/chat-persistence');
const { authenticateUser } = require('../../lib/auth-utils');

router.get('/', async (_req, res) => {
  try {
    const { user, error } = await authenticateUser();
    if (error) return res.status(error.status).json({ error: error.message });

    // Get user chat summary
    const summary = await ChatPersistence.getUserSummary(user.id);

    return res.json({
      summary,
    });
  } catch (error) {
    console.error('Error fetching chat analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch chat analytics' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { user, error } = await authenticateUser();
    if (error) return res.status(error.status).json({ error: error.message });

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const daysOld = parseInt(searchParams.get('daysOld') || '90');

    if (daysOld < 1) {
      return res.status(400).json({ error: 'daysOld must be at least 1' });
    }

    // Clean up old sessions
    const deletedCount = await ChatPersistence.cleanupOldSessions(user.id, daysOld);

    return res.json({
      deletedCount,
      message: `Successfully deleted ${deletedCount} old sessions`,
    });
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
    return res.status(500).json({ error: 'Failed to clean up old sessions' });
  }
});

module.exports = router;
