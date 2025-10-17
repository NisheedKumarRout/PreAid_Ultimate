// Local development environment configuration
// Copy this file and add your actual API keys for local development
window.ENV = {
  GEMINI_API_KEY: 'your-gemini-api-key-here',
  SUPABASE_URL: 'your-supabase-url-here',
  SUPABASE_ANON_KEY: 'your-supabase-anon-key-here',
  MAPTILER_API_KEY: 'your-maptiler-api-key-here',
  OPENAI_API_KEY: 'your-openai-api-key-here',
  COHERE_API_KEY: 'your-cohere-api-key-here',
  HUGGINGFACE_API_KEY: 'your-huggingface-api-key-here'
};

// Also set as process.env for compatibility
if (typeof process === 'undefined') {
  window.process = { env: window.ENV };
} else {
  Object.assign(process.env, window.ENV);
}

console.log('Environment configuration loaded - please add your API keys');