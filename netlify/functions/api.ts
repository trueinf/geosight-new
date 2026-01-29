// @ts-ignore - Netlify functions types
import { Handler } from '@netlify/functions';
import "dotenv/config";
import { createServer } from "../../server";

const app = createServer();

export const handler: Handler = async (event, context) => {
  console.log('🔍 Netlify function called:', { 
    path: event.path, 
    method: event.httpMethod,
    body: event.body,
    headers: event.headers 
  });

  // Debug environment variables
  console.log('🔍 Environment variables check:', {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'MISSING'
  });

  // Handle different routes - try multiple path patterns
  let path = event.path;
  if (path.includes('/.netlify/functions/api')) {
    path = path.replace('/.netlify/functions/api', '');
  }
  console.log('🔍 Processing path:', path);
  
  // Helper function to create req/res objects
  const createReqRes = () => {
    let parsedBody = {};
    try {
      parsedBody = event.body ? JSON.parse(event.body) : {};
    } catch (error) {
      console.error('Failed to parse request body:', error);
      parsedBody = {};
    }
    
    const req = {
      body: parsedBody,
      method: event.httpMethod,
      url: event.path,
      headers: event.headers
    } as any;
    
    let responseData: any = null;
    let statusCode = 200;
    
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      }
    } as any;
    
    return { req, res, getResponse: () => ({ data: responseData, statusCode }) };
  };

  if (path === '/api/claude/results' && event.httpMethod === 'POST') {
    const { handleClaudeResults } = await import('../../server/routes/claude-results');
    const { req, res, getResponse } = createReqRes();
    
    try {
      // Increased timeout to 28 seconds to give APIs more time (Netlify max is 30s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout after 28 seconds')), 28000);
      });
      
      const claudePromise = handleClaudeResults(req, res, () => {});
      
      await Promise.race([claudePromise, timeoutPromise]);
      
      const response = getResponse();
      console.log('🔍 Claude response:', response);
      return {
        statusCode: response.statusCode,
        body: JSON.stringify(response.data),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('🔍 Claude error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: (error as Error).message,
          type: 'claude_timeout_error',
          retry: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  if (path === '/api/openai/results' && event.httpMethod === 'POST') {
    const { handleOpenAIResults } = await import('../../server/routes/openai-results');
    const { req, res, getResponse } = createReqRes();
    
    try {
      // Increased timeout to 28 seconds to give APIs more time (Netlify max is 30s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout after 28 seconds')), 28000);
      });
      
      const openaiPromise = handleOpenAIResults(req, res, () => {});
      
      await Promise.race([openaiPromise, timeoutPromise]);
      
      const response = getResponse();
      return {
        statusCode: response.statusCode,
        body: JSON.stringify(response.data),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('🔍 OpenAI function error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: (error as Error).message,
          type: 'openai_timeout_error',
          retry: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  if (path === '/api/gemini/results' && event.httpMethod === 'POST') {
    const { handleGeminiResults } = await import('../../server/routes/gemini-results');
    const { req, res, getResponse } = createReqRes();
    
    try {
      // Increased timeout to 28 seconds to give APIs more time (Netlify max is 30s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout after 28 seconds')), 28000);
      });
      
      const geminiPromise = handleGeminiResults(req, res, () => {});
      
      await Promise.race([geminiPromise, timeoutPromise]);
      
      const response = getResponse();
      return {
        statusCode: response.statusCode,
        body: JSON.stringify(response.data),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('🔍 Gemini function error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: (error as Error).message,
          type: 'gemini_timeout_error',
          retry: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  if ((path === '/get-results' || path === '/api/get-results') && event.httpMethod === 'GET') {
    const { handleGetResults } = await import('../../server/routes/get-results');
    let statusCode = 200;
    let responseData: any = null;
    const req = {
      body: {},
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      query: event.queryStringParameters || {}
    } as any;
    const res = {
      status: (code: number) => { statusCode = code; return res; },
      json: (data: any) => { responseData = data; return res; }
    } as any;
    await handleGetResults(req, res);
    return {
      statusCode,
      body: responseData != null ? JSON.stringify(responseData) : '{}',
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (path === '/api/perplexity/results' && event.httpMethod === 'POST') {
    console.log('🔍 Perplexity function called with:', { path, body: event.body });
    const { handlePerplexityResults } = await import('../../server/routes/perplexity-results');
    const { req, res, getResponse } = createReqRes();
    
    try {
      // Increased timeout to 28 seconds to give APIs more time (Netlify max is 30s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout after 28 seconds')), 28000);
      });
      
      console.log('🔍 Calling handlePerplexityResults...');
      const perplexityPromise = handlePerplexityResults(req, res, () => {});
      
      await Promise.race([perplexityPromise, timeoutPromise]);
      
      const response = getResponse();
      console.log('🔍 Perplexity response:', response);
      return {
        statusCode: response.statusCode,
        body: JSON.stringify(response.data),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('🔍 Perplexity function error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: (error as Error).message,
          stack: (error as Error).stack,
          type: 'perplexity_timeout_error',
          retry: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  if ((path === '/api/store-results' || path === '/store-results') && event.httpMethod === 'POST') {
    const { handleStoreResults } = await import('../../server/routes/store-results');
    const { req, res, getResponse } = createReqRes();
    await handleStoreResults(req, res);
    const response = getResponse();
    return {
      statusCode: response.statusCode,
      body: JSON.stringify(response.data ?? {}),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if ((path === '/api/scheduled-searches' || path === '/scheduled-searches') && event.httpMethod === 'POST') {
    const { handleCreateScheduledSearch } = await import('../../server/routes/scheduled-searches');
    const { req, res, getResponse } = createReqRes();
    await handleCreateScheduledSearch(req, res);
    const response = getResponse();
    return {
      statusCode: response.statusCode,
      body: JSON.stringify(response.data ?? {}),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if ((path === '/api/scheduled-searches' || path === '/scheduled-searches') && event.httpMethod === 'GET') {
    const { handleGetScheduledSearches } = await import('../../server/routes/scheduled-searches');
    let statusCode = 200;
    let responseData: any = null;
    const req = {
      body: {},
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      query: event.queryStringParameters || {}
    } as any;
    const res = {
      status: (code: number) => { statusCode = code; return res; },
      json: (data: any) => { responseData = data; return res; }
    } as any;
    await handleGetScheduledSearches(req, res);
    return {
      statusCode,
      body: responseData != null ? JSON.stringify(responseData) : '{}',
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const scheduledDeleteMatch = path.match(/^\/(?:api\/)?scheduled-searches\/([^/]+)$/);
  if (scheduledDeleteMatch && event.httpMethod === 'DELETE') {
    const { handleDeleteScheduledSearch } = await import('../../server/routes/scheduled-searches');
    let statusCode = 200;
    let responseData: any = null;
    const req = {
      body: {},
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      params: { id: scheduledDeleteMatch[1] }
    } as any;
    const res = {
      status: (code: number) => { statusCode = code; return res; },
      json: (data: any) => { responseData = data; return res; }
    } as any;
    await handleDeleteScheduledSearch(req, res);
    return {
      statusCode,
      body: responseData != null ? JSON.stringify(responseData) : '{}',
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // Debug: show what path we received
  console.log('🔍 No route matched for path:', path);
  console.log('🔍 Available routes: /api/claude/results, /api/openai/results, /api/gemini/results, /api/perplexity/results, /api/store-results, /api/scheduled-searches');
  
  // Default response
  return {
    statusCode: 404,
    body: JSON.stringify({ 
      error: 'Not found',
      receivedPath: path,
      originalPath: event.path,
      method: event.httpMethod
    }),
    headers: { 'Content-Type': 'application/json' }
  };
};
