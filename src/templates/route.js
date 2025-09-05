const express = require('express');
const router = express.Router();
const { readFileSync } = require('fs');
const { join } = require('path');

function getTemplateFiles(templateId) {
  const templateFiles = [];

  try {
    const templateDir = join(process.cwd(), 'sandbox-templates', templateId);
    const fileMappings = {
      'code-interpreter-v1': ['script.py'],
      'nextjs-developer': ['_app.tsx', 'e2b.Dockerfile', 'e2b.toml', 'compile_page.sh'],
      'vue-developer': ['app.vue', 'e2b.Dockerfile', 'e2b.toml', 'nuxt.config.ts'],
      'streamlit-developer': ['app.py', 'e2b.Dockerfile', 'e2b.toml'],
      'gradio-developer': ['app.py', 'e2b.Dockerfile', 'e2b.toml']
    };

    const files = fileMappings[templateId] || [];

    for (const file of files) {
      try {
        const filePath = join(templateDir, file);
        const content = readFileSync(filePath, 'utf-8');
        templateFiles.push({
          name: file,
          content
        });
      } catch (error) {
        console.warn(`Failed to read template file ${file}:`, error);
      }
    }
  } catch (error) {
    console.warn(`Failed to load template files for ${templateId}:`, error);
  }

  return templateFiles;
}

router.get('/', (req, res) => {
  const templateId = req.query.templateId;

  if (!templateId) {
    return res.status(400).json({ error: 'templateId is required' });
  }

  const templateFiles = getTemplateFiles(templateId);
  return res.json(templateFiles);
});

module.exports = router;
