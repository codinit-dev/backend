const templates = require('./templates.json');

function templatesToPrompt(templates) {
  return `${Object.entries(templates).map(([id, t], index) => `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib ? t.lib.join(', ') : 'none'}. Port: ${t.port || 'none'}.`).join('\n')}`;
}

module.exports = { templates, templatesToPrompt };
