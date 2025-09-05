const express = require('express');
const router = express.Router();
const { createServerClient } = require('../../../lib/supabase-server'); // Adjust path as needed
const { createUsageMiddleware } = require('../../../lib/usage-tracker'); // Adjust path as needed
const { validateGitHubIdentifier, sanitizeForLogging } = require('../../../lib/security'); // Adjust path as needed
const fetch = require('node-fetch'); // Node-fetch for making HTTP requests

router.post('/', async (req, res) => {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check GitHub import limits before proceeding
    const usageMiddleware = createUsageMiddleware('github_imports', 1);
    
    try {
      const { trackUsage, remainingUsage } = await usageMiddleware(session.user.id);
      
      const body = req.body;
      const { owner, repo, importFiles = true } = body;

      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      // Validate GitHub parameters
      if (!validateGitHubIdentifier(owner, 'owner')) {
        return res.status(400).json({ error: 'Invalid owner name' });
      }

      if (!validateGitHubIdentifier(repo, 'repo')) {
        return res.status(400).json({ error: 'Invalid repository name' });
      }

      // Get GitHub integration
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('connection_data')
        .eq('user_id', session.user.id)
        .eq('service_name', 'github')
        .eq('is_connected', true)
        .single();

      if (!integration?.connection_data?.access_token) {
        return res.status(400).json({ error: 'GitHub not connected' });
      }

      // Get repository details - construct safe URL
      const repoUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const repoResponse = await fetch(repoUrl, {
        headers: {
          'Authorization': `Bearer ${integration.connection_data.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CodingIT-App/1.0',
        },
      });

      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          return res.status(404).json({ error: 'Repository not found' });
        }
        return res.status(500).json({ error: 'Failed to fetch repository' });
      }

      const repoData = await repoResponse.json();
      
      // Check repository size (in KB, limit to plan's storage limit)
      const repoSizeMB = Math.ceil(repoData.size / 1024); // Convert KB to MB
      
      // Create a new project for the imported repository
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: session.user.id,
          title: `${repoData.name} (GitHub Import)`,
          description: repoData.description || `Imported from ${repoData.full_name}`,
          template_id: 'github-import',
          metadata: {
            github_repo: {
              id: repoData.id,
              full_name: repoData.full_name,
              html_url: repoData.html_url,
              clone_url: repoData.clone_url,
              language: repoData.language,
              size: repoData.size,
              imported_at: new Date().toISOString()
            }
          }
        })
        .select()
        .single();

      if (projectError || !project) {
        console.error('Error creating project:', projectError);
        return res.status(500).json({ error: 'Failed to create project' });
      }

      let importedFiles = [];

      if (importFiles) {
        // Fetch repository contents - construct safe URL
        const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`;
        const contentsResponse = await fetch(contentsUrl, {
          headers: {
            'Authorization': `Bearer ${integration.connection_data.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodingIT-App/1.0',
          },
        });

        if (contentsResponse.ok) {
          const contents = await contentsResponse.json();
          importedFiles = await fetchRepositoryFiles(
            integration.connection_data.access_token,
            owner,
            repo,
            contents,
            project.id,
            session.user.id
          );
        }
      }

      // Track the GitHub import usage
      await trackUsage();

      return res.json({
        success: true,
        project: {
          id: project.id,
          title: project.title,
          description: project.description
        },
        repository: {
          name: repoData.name,
          full_name: repoData.full_name,
          html_url: repoData.html_url,
          language: repoData.language,
          size: repoData.size
        },
        imported_files_count: importedFiles.length,
        remaining_imports: remainingUsage
      });

    } catch (usageError) {
      if (usageError.code === 'FEATURE_LIMIT_EXCEEDED') {
        return res.status(429).json({
          error: usageError.message,
          code: usageError.code,
          currentUsage: usageError.currentUsage,
          limit: usageError.limit,
          upgradeRequired: usageError.upgradeRequired
        });
      }
      throw usageError;
    }

  } catch (error) {
    console.error('GitHub import error:', error);
    return res.status(500).json({ error: 'Import failed' });
  }
});

async function fetchRepositoryFiles(
  accessToken,
  owner,
  repo,
  contents,
  projectId,
  userId,
  path = ''
) {
  const supabase = createServerClient();
  const files = [];

  for (const item of contents.slice(0, 50)) { // Limit to 50 files per request
    if (item.type === 'file' && item.size < 1048576) { // Skip files larger than 1MB
      try {
        const fileResponse = await fetch(item.download_url || item.url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodingIT-App/1.0',
          },
        });

        if (fileResponse.ok) {
          let content = '';
          
          if (item.download_url) {
            content = await fileResponse.text();
          } else {
            const fileData = await fileResponse.json();
            content = fileData.content ? Buffer.from(fileData.content, 'base64').toString('utf8') : '';
          }

          // Create fragment for the file
          const { data: fragment, error } = await supabase
            .from('fragments')
            .insert({
              user_id: userId,
              project_id: projectId,
              title: item.name,
              description: `File imported from GitHub: ${owner}/${repo}`,
              template: 'code-interpreter-v1', // Default template
              code: content,
              file_path: item.path,
              metadata: {
                github_import: true,
                original_path: item.path,
                file_size: item.size,
                imported_at: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (!error && fragment) {
            files.push({
              name: item.name,
              path: item.path,
              size: item.size,
              fragment_id: fragment.id
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to import file ${item.path}:`, error);
      }
    } else if (item.type === 'dir' && files.length < 100) { // Recursively fetch directories, limit total files
      try {
        const dirResponse = await fetch(item.url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodingIT-App/1.0',
          },
        });

        if (dirResponse.ok) {
          const dirContents = await dirResponse.json();
          const subFiles = await fetchRepositoryFiles(
            accessToken,
            owner,
            repo,
            dirContents,
            projectId,
            userId,
            item.path
          );
          files.push(...subFiles);
        }
      } catch (error) {
        console.warn(`Failed to fetch directory ${item.path}:`, error);
      }
    }
  }

  return files;
}

module.exports = router;
