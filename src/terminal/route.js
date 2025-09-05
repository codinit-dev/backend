const express = require('express');
const router = express.Router();
const { Sandbox } = require('@e2b/code-interpreter');

router.post('/', async (req, res) => {
  try {
    const { 
      command, 
      sbxId, 
      workingDirectory = '/home/user',
      teamID,
      accessToken 
    } = req.body;

    if (!command || !sbxId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const sandbox = await Sandbox.connect(sbxId, {
      ...(teamID && accessToken
        ? {
            headers: {
              'X-Supabase-Team': teamID,
              'X-Supabase-Token': accessToken,
            },
          }
        : {}),
    });

    const fullCommand = `cd "${workingDirectory}" && ${command}`;
    
    const result = await sandbox.commands.run(fullCommand, {
      timeoutMs: 30000,
    });

    return res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      workingDirectory,
    });

  } catch (error) {
    console.error('Terminal command error:', error);
    
    return res.status(500).json({ 
      error: error.message || 'Failed to execute command',
      stderr: error.message || 'Command execution failed'
    });
  }
});

module.exports = router;
