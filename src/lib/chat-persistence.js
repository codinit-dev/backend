// Placeholder for chat persistence service
const ChatPersistence = {
  async getUserSummary(userId) {
    // Mock data
    return {
      totalSessions: 10,
      totalMessages: 150,
      lastActive: new Date().toISOString(),
      favoriteTemplate: 'code-interpreter-v1',
    };
  },

  async cleanupOldSessions(userId, daysOld) {
    // Mock deletion
    console.log(`Cleaning up sessions older than ${daysOld} days for user ${userId}`);
    return Math.floor(Math.random() * 5); // Return a random number of deleted sessions
  },

  async exportUserData(userId) {
    // Mock data
    return {
      sessions: [
        { sessionId: 'session-1', createdAt: '2025-04-01T10:00:00Z', template: 'code-interpreter-v1' },
        { sessionId: 'session-2', createdAt: '2025-04-02T11:00:00Z', template: 'nextjs-developer' },
      ],
      messages: {
        'session-1': [
          { role: 'user', content: 'Hello', timestamp: '2025-04-01T10:01:00Z' },
          { role: 'assistant', content: 'Hi there!', timestamp: '2025-04-01T10:02:00Z' },
        ],
        'session-2': [
          { role: 'user', content: 'Create a React component', timestamp: '2025-04-02T11:01:00Z' },
          { role: 'assistant', content: 'Sure, here is a basic component...', timestamp: '2025-04-02T11:03:00Z' },
        ],
      },
    };
  },
};

module.exports = { ChatPersistence };
