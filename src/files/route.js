const express = require('express');
const router = express.Router();
const { Sandbox, FileType } = require('@e2b/code-interpreter');
const { getSandbox } = require('../lib/sandbox');

async function listFilesRecursively(
  sandbox,
  path,
) {
  const files = await sandbox.files.list(path);
  const nodes = [];

  for (const file of files) {
    const fullPath = `${path}/${file.name}`;
    if (file.type === FileType.DIR) {
      nodes.push({
        name: file.name,
        isDirectory: true,
        children: await listFilesRecursively(sandbox, fullPath),
      });
    } else {
      nodes.push({
        name: file.name,
        isDirectory: false,
        path: fullPath,
      });
    }
  }
  return nodes;
}

router.get('/', async (req, res) => {
  const sessionID = req.query.sessionID;
  const template = req.query.template;

  if (!sessionID) {
    return res.status(400).json({ error: 'sessionID is required' });
  }

  try {
    const sandbox = await getSandbox(sessionID, template || undefined);
    const fileTree = await listFilesRecursively(sandbox, '/');
    return res.json(fileTree);
  } catch (error) {
    console.error('Error fetching file tree:', error);
    return res.status(500).json({ error: 'Failed to fetch file tree' });
  }
});

module.exports = router;
