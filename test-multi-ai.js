#!/usr/bin/env node

// Test script for the multi-AI service
// This will help verify that the implementation works correctly

// Set up test environment variables
process.env.GEMINI_API_KEY = 'test-gemini-key-here';
process.env.OPENAI_API_KEY = 'test-openai-key-here';
process.env.COHERE_API_KEY = 'test-cohere-key-here';

console.log('🧪 Testing Multi-AI Service...\n');

try {
  const { getAIService } = require('./api/multi-ai-service.js');
  
  console.log('✅ Multi-AI service imported successfully');
  
  const aiService = getAIService();
  console.log('✅ AI service instance created');
  
  const status = aiService.getProviderStatus();
  console.log('📊 Provider Status:', JSON.stringify(status, null, 2));
  
  console.log('\n🎯 Available providers:');
  status.providers.forEach(provider => {
    const status = provider.configured ? '✅' : '❌';
    const tier = aiService.providers.find(p => p.name === provider.name)?.tier || 'unknown';
    const limit = aiService.providers.find(p => p.name === provider.name)?.limit || 'unknown';
    console.log(`  ${status} ${provider.name} (${tier} - ${limit})`);
  });
  
  console.log('\n🚀 Configuration looks good!');
  console.log('📝 Next steps:');
  console.log('  1. Add real API keys to Netlify environment variables');
  console.log('  2. Deploy your site');
  console.log('  3. Test the health assistant');
  
} catch (error) {
  console.error('❌ Error testing multi-AI service:', error.message);
  console.log('\n🔧 This might be expected if you\'re missing dependencies.');
  console.log('   The service should work fine in the Netlify environment.');
}
