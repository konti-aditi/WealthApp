#!/bin/bash

# Cloud Run Deployment Script for WealthApp Backend
# This deploys your application with FFmpeg to Cloud Run

set -e  # Exit on error

PROJECT_ID="calcium-backup-481015-r3"
SERVICE_NAME="wealth-app-backend"
REGION="asia-south1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting Cloud Run deployment..."
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo ""

# Step 1: Build and push Docker image
echo "📦 Step 1/3: Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME} --project=${PROJECT_ID}

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker image built successfully!"
echo ""

# Step 2: Deploy to Cloud Run
echo "🚢 Step 2/3: Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 40 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "BUCKET_NAME=nl-ffmpeg-backend" \
  --set-env-vars "EMAIL_HOST=live.smtp.mailtrap.io" \
  --set-env-vars "EMAIL_PORT=587" \
  --set-env-vars "EMAIL_SECURE=false" \
  --set-env-vars "EMAIL_USER=smtp@mailtrap.io" \
  --set-env-vars "EMAIL_PASSWORD=e675c59a2b0e8663aee0c6d72f28e5a8" \
  --set-env-vars "EMAIL_FROM=hello@divyanshanand.info" \
  --set-env-vars "JWT_EXPIRES_IN=1d" \
  --set-env-vars "JWT_TOKEN_SECRET=769a321c563e93ab5e98280f624816c61d9d6ab31818040c13312320ce88a2882acaccc26a614c51fa1255ee046bce2188cd921a797d2d0f20bd3724c389c8f3b373b81838e226c8d393f27034f8fe2253fb3d834cee8096fc4b96ba87eebca2a5542be6c397ea21aaee36cd91b61bab72e5147068719e4ac57d8f9162417945" \
  --set-env-vars "REFRESH_TOKEN_SECRET=11e74c6b4b269c66551a9dcb16835e3bc6be1d5b025f2098b28c2572cf4c03c390b58b4a504b0387c180829544210ad9dd2acf975833a9d8078a24358fcd191af3ada38743838864abedba3403af0d2d21c9636e07f3a5c4c8afa5b1aa19bc61ae4cbc4d908ae66a39767e0d6c5b28c0dae342a5f0531209d765c82e48fbeee7" \
  --set-env-vars "NODE_ENV=development"

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed!"
    exit 1
fi

echo "✅ Deployed to Cloud Run successfully!"
echo ""

# Step 3: Get service URL
echo "🔗 Step 3/3: Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --format 'value(status.url)')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "Test endpoints:"
echo "  curl ${SERVICE_URL}/ping"
echo "  curl -X POST ${SERVICE_URL}/rotate-video -F 'video=@test.mp4'"
echo ""
echo "View logs:"
echo "  gcloud run logs read --service=${SERVICE_NAME} --region=${REGION}"
echo ""
echo "Manage service:"
echo "  https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}?project=${PROJECT_ID}"
echo ""
