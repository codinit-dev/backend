require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello from the Node.js Express backend!');
});

const analyticsBusinessRoutes = require('./analytics/business/route.js');
const analyticsExportRoutes = require('./analytics/export/route.js');
const chatRoutes = require('./chat/route.js');
const chatAnalyticsRoutes = require('./chat/analytics/route.js');
const chatExportRoutes = require('./chat/export/route.js');
const filesRoutes = require('./files/route.js');
const filesContentRoutes = require('./files/content/route.js');
const githubImportRoutes = require('./integrations/github/import/route.js');
const sandboxRoutes = require('./sandbox/route.js');
const subscriptionUsageRoutes = require('./subscription/usage/route.js');
const templatesRoutes = require('./templates/route.js');
const terminalRoutes = require('./terminal/route.js');
const webhooksRoutes = require('./webhooks/route.js');
const apiRoutes = require('./routes/api.js');

app.use('/api', apiRoutes);
app.use('/api/analytics/business', analyticsBusinessRoutes);
app.use('/api/analytics/export', analyticsExportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat/analytics', chatAnalyticsRoutes);
app.use('/api/chat/export', chatExportRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/files/content', filesContentRoutes);
app.use('/api/integrations/github/import', githubImportRoutes);
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/subscription/usage', subscriptionUsageRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/webhooks', webhooksRoutes);


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
