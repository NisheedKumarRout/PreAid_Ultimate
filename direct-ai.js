// Direct AI API calls for local development
async function callDirectAI(message) {
  const apiKeys = {
    gemini: window.ENV?.GEMINI_API_KEY,
    openai: window.ENV?.OPENAI_API_KEY,
    cohere: window.ENV?.COHERE_API_KEY
  };
  
  console.log('API Keys available:', {
    gemini: !!apiKeys.gemini,
    openai: !!apiKeys.openai,
    cohere: !!apiKeys.cohere
  });
  
  // Try Gemini first
  if (apiKeys.gemini) {
    try {
      console.log('Trying Gemini API...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are PreAid, an AI health assistant. Follow this protocol EXACTLY:
1. Check if "${message}" is a valid health issue
2. If YES: Check if it's severe (CPR, fractures, bleeding, choking, spinal injuries, etc.) where untrained help could cause harm
   - If SEVERE: Start with "⚠️ WARNING: If you don't have 100% knowledge, wait for professional help." then provide EXACTLY 75-200 words of guidance
   - If NOT SEVERE: Provide EXACTLY 75-200 words of medical advice
3. If NOT health-related: Say "Hey, this isn't an emergency but I can still briefly help 😊" then help jokingly in EXACTLY 50-100 words

IMPORTANT: Keep your response within the specified word count. Do not exceed 200 words for health issues or 100 words for non-health issues.

Query: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7
          }
        })
      });
      
      console.log('Gemini response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Gemini response data:', data);
        
        // Check for text in parts
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log('Gemini success!');
          return text;
        }
        
        // Check if response was cut off due to MAX_TOKENS
        if (data?.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
          console.log('Gemini response was truncated due to max tokens');
          throw new Error('Response truncated - trying next API');
        }
        
        console.log('Gemini response structure:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('Gemini error response:', errorText);
      }
    } catch (error) {
      console.log('Gemini failed:', error.message);
    }
  }
  
  // Try OpenAI
  if (apiKeys.openai) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `You are PreAid, an AI health assistant. Follow this protocol EXACTLY:
1. Check if "${message}" is a valid health issue
2. If YES: Check if it's severe (CPR, fractures, bleeding, choking, spinal injuries, etc.) where untrained help could cause harm
   - If SEVERE: Start with "⚠️ WARNING: If you don't have 100% knowledge, wait for professional help." then provide EXACTLY 75-200 words of guidance
   - If NOT SEVERE: Provide EXACTLY 75-200 words of medical advice
3. If NOT health-related: Say "Hey, this isn't an emergency but I can still briefly help 😊" then help jokingly in EXACTLY 50-100 words

IMPORTANT: Keep your response within the specified word count. Do not exceed 200 words for health issues or 100 words for non-health issues.

${currentUser && !isGuest ? `Previous health history: ${JSON.stringify(chatHistory.slice(-3))}` : ''}
Query: ${message}` }],
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (error) {
      console.log('OpenAI failed:', error.message);
    }
  }
  
  // Try Cohere
  if (apiKeys.cohere) {
    try {
      const response = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.cohere}`
        },
        body: JSON.stringify({
          model: 'command-r',
          messages: [{
            role: 'user',
            content: `You are PreAid, an AI health assistant. Follow this protocol EXACTLY:
1. Check if "${message}" is a valid health issue
2. If YES: Check if it's severe (CPR, fractures, bleeding, choking, spinal injuries, etc.) where untrained help could cause harm
   - If SEVERE: Start with "⚠️ WARNING: If you don't have 100% knowledge, wait for professional help." then provide EXACTLY 75-200 words of guidance
   - If NOT SEVERE: Provide EXACTLY 75-200 words of medical advice
3. If NOT health-related: Say "Hey, this isn't an emergency but I can still briefly help 😊" then help jokingly in EXACTLY 50-100 words

IMPORTANT: Keep your response within the specified word count. Do not exceed 200 words for health issues or 100 words for non-health issues.

${currentUser && !isGuest ? `Previous health history: ${JSON.stringify(chatHistory.slice(-3))}` : ''}
Query: ${message}`
          }],
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const text = data?.message?.content?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (error) {
      console.log('Cohere failed:', error.message);
    }
  }
  
  throw new Error('All AI services failed');
}