const { Sandbox } = require('@e2b/code-interpreter');

const E2B_API_KEY = process.env.E2B_API_KEY;
const sandboxTimeout = 10 * 60 * 1000;

async function getSandbox(sessionID, template) {
  if (!E2B_API_KEY) {
    throw new Error('E2B_API_KEY environment variable not found');
  }

  const sandboxes = await Sandbox.list();

  const sandboxID = sandboxes.find(sandbox => sandbox.metadata?.sessionID === sessionID)?.sandboxId;

  if (sandboxID) {
    const sandbox = await Sandbox.connect(sandboxID, {
        apiKey: E2B_API_KEY,
      });
    await sandbox.setTimeout(sandboxTimeout);
    return sandbox;
  } else {
    const sandbox = await Sandbox.create({
        apiKey: E2B_API_KEY,
        metadata: {
          sessionID,
          template: template || 'code-interpreter-v1',
        },
        timeoutMs: sandboxTimeout
    });
    return sandbox;
  }
}

module.exports = { getSandbox };
