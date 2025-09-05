// Placeholder for prompt utility functions
function toPrompt(template) {
  // This is a simplified version. In a real scenario, this would
  // convert a template object into a string prompt for the LLM.
  return `You are an AI assistant. Your task is to respond based on the following template: ${template.name || 'default'}.`;
}

module.exports = { toPrompt };
