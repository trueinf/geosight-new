#!/bin/bash

echo "=== GeoSight Netlify Deployment Script ==="
echo "Deploying GeoSight with Claude 4.5 Sonnet to Netlify..."

# Build the application
echo "Building application..."
npm run build:client

# Check if build was successful
if [ ! -d "dist/spa" ]; then
    echo "❌ Build failed - dist/spa directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create deployment package
echo "Creating deployment package..."
cd dist/spa
tar -czf ../../geosight-netlify-deploy.tar.gz .
cd ../..

echo "✅ Deployment package created: geosight-netlify-deploy.tar.gz"

# Display deployment instructions
echo ""
echo "🚀 DEPLOYMENT INSTRUCTIONS:"
echo "=========================="
echo ""
echo "Method 1 - Manual Upload:"
echo "1. Go to https://app.netlify.com/"
echo "2. Find your site (ID: 0fb7e521-1c34-4e23-8198-fd62a6c782a0)"
echo "3. Drag the 'dist/spa' folder to the deploy area"
echo ""
echo "Method 2 - GitHub Integration:"
echo "1. Go to https://app.netlify.com/"
echo "2. Connect your GitHub repository: https://github.com/trueinf/geosight"
echo "3. Set build command: npm run build:client"
echo "4. Set publish directory: dist/spa"
echo "5. Add environment variables:"
echo "   - ANTHROPIC_API_KEY"
echo "   - OPENAI_API_KEY"
echo "   - GEMINI_API_KEY"
echo "   - OPENROUTER_API_KEY"
echo ""
echo "Method 3 - CLI (if authenticated):"
echo "netlify deploy --prod --dir=dist/spa"
echo ""
echo "🎯 Your site will be available at: https://geositev2.netlify.app/"
echo ""
echo "✅ Deployment package ready!"
