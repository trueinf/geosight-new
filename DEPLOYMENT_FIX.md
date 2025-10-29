# Netlify Deployment Fix Guide

## 🚨 Error Resolution: API Key Issues

The error you're seeing (`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`) indicates API authentication problems during deployment.

## ✅ Solution Steps:

### 1. Set Environment Variables in Netlify
Go to your Netlify dashboard and add these environment variables:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-key
OPENAI_API_KEY=sk-proj-your-openai-key
GEMINI_API_KEY=your-gemini-key
OPENROUTER_API_KEY=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
```

### 2. Update Netlify Configuration
The current `netlify.toml` is correct, but let's ensure it handles API routes properly.

### 3. Deploy Steps:
1. **Go to**: https://app.netlify.com/
2. **Find your site**: geositev2 (ID: 0fb7e521-1c34-4e23-8198-fd62a6c782a0)
3. **Site Settings** → **Environment Variables**
4. **Add all 4 API keys**
5. **Deploy** → Drag `dist/spa` folder

### 4. Alternative: GitHub Integration
1. **New Site from Git**
2. **Connect**: trueinf/geosight
3. **Build Command**: `npm run build:client`
4. **Publish Directory**: `dist/spa`
5. **Environment Variables**: Add all API keys
6. **Deploy**

## 🔧 Troubleshooting:
- Ensure API keys are valid and active
- Check that environment variables are set correctly
- Verify the build completes successfully locally
- Make sure all dependencies are in package.json

## 🎯 Expected Result:
Your GeoSight app with Claude 4.5 Sonnet will be live at:
**https://geositev2.netlify.app/**
