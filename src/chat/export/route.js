const express = require('express');
const router = express.Router();
const { ChatPersistence } = require('../../lib/chat-persistence');
const { authenticateUser } = require('../../lib/auth-utils');

router.get('/', async (req, res) => {
  try {
    const { user, error } = await authenticateUser();
    if (error) return res.status(error.status).json({ error: error.message });

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const format = searchParams.get('format') || 'json';

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Supported formats: json, csv' });
    }

    // Export user's chat data
    const { sessions, messages } = await ChatPersistence.exportUserData(user.id);
    
    // Generate export date once for consistency
    const exportDate = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        totalSessions: sessions.length,
        totalMessages: Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0),
        sessions,
        messages,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="chat-export-${user.id}-${exportDate}.json"`);
      return res.status(200).json(exportData);
    }

    if (format === 'csv') {
      // Helper function to properly escape and quote CSV fields
      const escapeCsvField = (field) => {
        if (!field) return '""';
        // Quote the field and escape any quotes within it
        return `"${field.replace(/"/g, '""')}"`;
      };

      // Convert to CSV format
      const csvLines = ['Session ID,Timestamp,Role,Content,Model,Template'];
      
      sessions.forEach(session => {
        const sessionMessages = messages[session.sessionId] || [];
        sessionMessages.forEach(message => {
          const csvLine = [
            escapeCsvField(session.sessionId),
            escapeCsvField(message.timestamp),
            escapeCsvField(message.role),
            escapeCsvField(message.content),
            escapeCsvField(message.model || ''),
            escapeCsvField(message.template || '')
          ].join(',');
          csvLines.push(csvLine);
        });
      });

      const csvContent = csvLines.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="chat-export-${user.id}-${exportDate}.csv"`);
      return res.status(200).send(csvContent);
    }

    return res.status(400).json({ error: 'Invalid format specified' });
  } catch (error) {
    console.error('Error exporting chat data:', error);
    return res.status(500).json({ error: 'Failed to export chat data' });
  }
});

module.exports = router;
