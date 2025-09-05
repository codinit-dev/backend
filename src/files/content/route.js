const express = require('express');
const router = express.Router();
const { Sandbox } = require('@e2b/code-interpreter');
const { LRUCache } = require('lru-cache');

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

const E2B_API_KEY = process.env.E2B_API_KEY;

const sandboxTimeout = 10 * 60 * 1000;

async function getSandbox(sessionID, template) {
  const sandbox = await Sandbox.create(template || 'code-interpreter-v1', {
    apiKey: E2B_API_KEY,
    metadata: {
      sessionID,
      template: template || 'code-interpreter-v1',
    },
    timeoutMs: sandboxTimeout,
  });
  return sandbox;
}

router.get('/', async (req, res) => {
  try {
    if (!E2B_API_KEY) {
      return res.status(500).json({ error: 'E2B_API_KEY environment variable not found' });
    }

    const sessionID = req.query.sessionID;
    const path = req.query.path;
    const template = req.query.template;

    if (!sessionID || !path) {
      return res.status(400).json({ error: 'sessionID and path are required' });
    }

    const cacheKey = `${sessionID}:${path}`;
    const cachedContent = cache.get(cacheKey);

    if (cachedContent) {
      return res.json({ content: cachedContent });
    }

    const sandbox = await getSandbox(sessionID, template || undefined);
    const content = await sandbox.files.read(path);

    cache.set(cacheKey, content);

    return res.json({ content });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'An unexpected error occurred' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { sessionID, path, content, template } = req.body;

    if (!sessionID || !path || content === undefined) {
      return res.status(400).json({ error: 'sessionID, path and content are required' });
    }

    const sandbox = await getSandbox(sessionID, template || undefined);
    await sandbox.files.write(path, content);

    const cacheKey = `${sessionID}:${path}`;
    cache.delete(cacheKey);

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'An unexpected error occurred' });
  }
});

module.exports = router;
