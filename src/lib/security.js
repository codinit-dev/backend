// Placeholder for security utility functions
function validateGitHubIdentifier(identifier, type) {
  // Basic validation for GitHub owner/repo names
  // GitHub usernames/repo names can contain alphanumeric characters and hyphens.
  // They cannot start or end with a hyphen, and cannot have consecutive hyphens.
  const regex = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
  return regex.test(identifier);
}

function sanitizeForLogging(data) {
  // Remove sensitive information before logging
  const sanitizedData = { ...data };
  if (sanitizedData.accessToken) {
    sanitizedData.accessToken = '[REDACTED]';
  }
  if (sanitizedData.apiKey) {
    sanitizedData.apiKey = '[REDACTED]';
  }
  // Add more sensitive fields as needed
  return sanitizedData;
}

module.exports = { validateGitHubIdentifier, sanitizeForLogging };
