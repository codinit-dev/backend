const { createServerClient } = require('./supabase-server');

async function authenticateUser() {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        user: null,
        error: { message: 'Unauthorized', status: 401 }
      };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: { message: 'Authentication failed', status: 500 }
    };
  }
}

function withAuth(handler) {
  return async (...args) => {
    const { user, error } = await authenticateUser();
    
    if (error) {
      return error;
    }

    return handler(user, ...args);
  };
}

module.exports = { authenticateUser, withAuth };
