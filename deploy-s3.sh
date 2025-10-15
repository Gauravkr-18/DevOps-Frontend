#!/bin/bash

# S3 Deployment script for Workshop Platform Frontend
# This script builds and deploys the frontend to S3

set -e

echo "Starting frontend deployment to S3..."

# Configuration
S3_BUCKET=${S3_BUCKET:-"your-frontend-bucket-name"}
CLOUDFRONT_DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID:-""}
BACKEND_URL=${BACKEND_URL:-"https://your-backend-domain.com/api"}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

# Create build directory
mkdir -p build
cp -r * build/ 2>/dev/null || true
cd build

# Update config.js with production backend URL
cat > config.js << EOF
window.BACKEND_URL = '${BACKEND_URL}';

// Environment-specific configurations
if (window.location.hostname.includes('staging')) {
    window.BACKEND_URL = '${BACKEND_URL}'.replace('api', 'staging-api');
} else if (window.location.hostname.includes('dev')) {
    window.BACKEND_URL = '${BACKEND_URL}'.replace('api', 'dev-api');
}
EOF

echo "Updated backend URL to: ${BACKEND_URL}"

# Sync files to S3
echo "Uploading files to S3 bucket: ${S3_BUCKET}"
aws s3 sync . s3://${S3_BUCKET}/ --delete \
    --cache-control "text/html:max-age=0,no-cache" \
    --cache-control "text/css:max-age=31536000" \
    --cache-control "application/javascript:max-age=31536000" \
    --cache-control "image/*:max-age=31536000"

# Set correct content types
aws s3 cp s3://${S3_BUCKET}/index.html s3://${S3_BUCKET}/index.html \
    --content-type "text/html" --metadata-directive REPLACE

aws s3 cp s3://${S3_BUCKET}/style.css s3://${S3_BUCKET}/style.css \
    --content-type "text/css" --metadata-directive REPLACE

aws s3 cp s3://${S3_BUCKET}/script.js s3://${S3_BUCKET}/script.js \
    --content-type "application/javascript" --metadata-directive REPLACE

aws s3 cp s3://${S3_BUCKET}/config.js s3://${S3_BUCKET}/config.js \
    --content-type "application/javascript" --metadata-directive REPLACE

# Invalidate CloudFront cache if distribution ID is provided
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --paths "/*"
fi

# Clean up
cd ..
rm -rf build

echo "Frontend deployment completed successfully!"
echo "Frontend URL: http://${S3_BUCKET}.s3-website-us-east-1.amazonaws.com"

if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "CloudFront URL: https://your-cloudfront-domain.com"
fi