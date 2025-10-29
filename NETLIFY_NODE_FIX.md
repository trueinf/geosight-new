# Netlify Deployment Fix - Node Version Issue Resolved

## 🚨 Problem Identified & Fixed

**Issue**: Netlify was using Node v22.21.1 which caused build failures due to compatibility issues.

**Solution**: Configured Netlify to use Node 18 for stable builds.

## ✅ Changes Made

### 1. Added Node Version Constraints
- **package.json**: Added `engines` field specifying Node >=18.0.0
- **.nvmrc**: Created file specifying Node 18
- **netlify.toml**: Added `NODE_VERSION = "18"` in build environment

### 2. Files Updated
```json
// package.json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=8.0.0"
}
```

```toml
# netlify.toml
[build.environment]
  NODE_VERSION = "18"
```

```bash
# .nvmrc
18
```

## 🚀 Deployment Instructions

### Option 1: GitHub Integration (Recommended)
1. **Go to**: https://app.netlify.com/
2. **Connect GitHub**: Select repository `trueinf/geosight`
3. **Build Settings**:
   - Build command: `npm run build:client`
   - Publish directory: `dist/spa`
4. **Environment Variables** (Add these):
   ```
   ANTHROPIC_API_KEY = sk-ant-api03-YOUR_FULL_KEY
   OPENAI_API_KEY = sk-proj-YOUR_FULL_KEY
   GEMINI_API_KEY = AIzaSyC-YOUR_FULL_KEY
   OPENROUTER_API_KEY = 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
   ```
5. **Deploy**: Click "Deploy site"

### Option 2: Manual Upload
1. **Go to**: https://app.netlify.com/
2. **Find site**: geositev2 (ID: 0fb7e521-1c34-4e23-8198-fd62a6c782a0)
3. **Drag & Drop**: Drag `dist/spa` folder to deploy area
4. **Set Environment Variables**: Add all 4 API keys

## ✅ What's Fixed

- **Node Version**: Now uses Node 18 (stable, compatible)
- **Build Process**: Tested and working locally
- **Claude 4.5 Sonnet**: Updated to `claude-sonnet-4-5-20250929`
- **All API Keys**: Configured and ready
- **GitHub Updated**: Latest changes pushed

## 🎯 Expected Result

Your GeoSight application will be live at:
**https://geositev2.netlify.app/**

The Node version issue should now be resolved, and the build should complete successfully! 🚀
