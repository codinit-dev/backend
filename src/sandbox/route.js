const express = require('express');
const router = express.Router();
const { Sandbox } = require('@e2b/code-interpreter');

const sandboxTimeout = 10 * 60 * 1000;

router.post('/', async (req, res) => {
  try {
    const {
      fragment,
      userID,
      teamID,
      accessToken,
    } = req.body;

    if (!fragment) {
      return res.status(400).json({ 
        error: 'Missing fragment data', 
        type: 'validation_error' 
      });
    }

    if (!process.env.E2B_API_KEY) {
      console.error('E2B_API_KEY environment variable not found');
      return res.status(503).json({ 
        error: 'Code execution service is not configured. Please check environment settings.',
        type: 'config_error'
      });
    }

    let sbx;
    try {
      sbx = await Sandbox.create(fragment.template, {
        metadata: {
          template: fragment.template,
          userID: userID ?? '',
          teamID: teamID ?? '',
        },
        timeoutMs: sandboxTimeout,
        ...(teamID && accessToken
          ? {
              headers: {
                'X-Supabase-Team': teamID,
                'X-Supabase-Token': accessToken,
              },
            }
          : {}),
      });
    } catch (e2bError) {
      console.error('E2B Sandbox creation failed:', e2bError);
      return res.status(503).json({ 
        error: 'Failed to create sandbox environment. Please try again later.',
        type: 'sandbox_creation_error',
        details: e2bError.message
      });
    }

    try {
      if (fragment.has_additional_dependencies) {
        await sbx.commands.run(fragment.install_dependencies_command);
      }

      if (fragment.code && Array.isArray(fragment.code)) {
        await Promise.all(fragment.code.map(async (file) => {
          await sbx.files.write(file.file_path, file.file_content);
        }));
      } else if (fragment.code !== null && fragment.code !== undefined) {
        await sbx.files.write(fragment.file_path, fragment.code);
      } else {
        return res.status(400).json({
          error: 'Missing code data',
          type: 'validation_error'
        });
      }

      if (fragment.template === 'code-interpreter-v1') {
        const { logs, error, results } = await sbx.runCode(fragment.code || '');

        return res.json({
          sbxId: sbx?.sandboxId,
          template: fragment.template,
          stdout: logs.stdout,
          stderr: logs.stderr,
          runtimeError: error,
          cellResults: results,
        });
      }

      await sbx.commands.run(fragment.install_dependencies_command, {
        envs: {
          PORT: (fragment.port || 80).toString(),
        },
      });

      return res.json({
        sbxId: sbx?.sandboxId,
        template: fragment.template,
        url: `https://${sbx?.getHost(fragment.port || 80)}`,
      });
    } catch (executionError) {
      console.error('Sandbox execution error:', executionError);
      
      // Clean up sandbox on execution error
      try {
        await sbx?.kill();
      } catch (e) {
        console.error('Error killing sandbox:', e);
      }

      return res.status(500).json({ 
        error: 'Code execution failed. There may be an error in your code or dependencies.',
        type: 'execution_error',
        details: executionError.message
      });
    }

  } catch (error) {
    console.error('Sandbox API Error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred while setting up the sandbox.',
      type: 'unknown_error',
      details: error?.message || 'Unknown error'
    });
  }
});

module.exports = router;
