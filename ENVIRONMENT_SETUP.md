# Environment Setup

## Required API Keys

The application requires the following API keys to be set as environment variables:

### 1. OpenAI API Key (for ChatGPT)
- **Variable**: `OPENAI_API_KEY`
- **Get from**: https://platform.openai.com/api-keys
- **Usage**: ChatGPT results

### 2. Anthropic API Key (for Claude)
- **Variable**: `ANTHROPIC_API_KEY`
- **Get from**: https://console.anthropic.com/
- **Usage**: Claude results

### 3. Google Gemini API Key
- **Variable**: `GEMINI_API_KEY`
- **Get from**: https://makersuite.google.com/app/apikey
- **Usage**: Gemini results

### 4. Perplexity provider (use one of these)
- **Option A – Native Perplexity**: `PERPLEXITY_API_KEY` from https://docs.perplexity.ai (recommended for Perplexity)
- **Option B – OpenRouter**: `OPENROUTER_API_KEY` from https://openrouter.ai/keys (uses OpenRouter with GPT-4o-mini)
- **Usage**: Perplexity results; if both are set, the app uses the native Perplexity API

## Setup Instructions

1. Create a `.env` file in the root directory
2. Add the following content (replace with your actual API keys):

```env
# API Keys for AI Providers
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
# Perplexity: set one (native key preferred)
PERPLEXITY_API_KEY=your_perplexity_api_key_here
# OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Site configuration
SITE_URL=https://geosight.app
SITE_NAME=GeoSight
PING_MESSAGE=pong
```

3. Restart the server after adding the environment variables

## Perplexity 401 "User not found"

If you see **401 Unauthorized** / "User not found" for the Perplexity provider:

- **Using OpenRouter**: Your `OPENROUTER_API_KEY` may be invalid or expired. Create a new key at https://openrouter.ai/keys and update `.env`.
- **Using native Perplexity**: Set `PERPLEXITY_API_KEY` from https://docs.perplexity.ai (create an API group and generate a key). The app prefers this over OpenRouter when both are set.


