#!/bin/bash

# Build script for Railway deployment
# This script builds Docker images optimized for Railway

set -e

echo "🚀 Building Docker images for Railway deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build backend image
print_status "Building backend image..."
if docker build -f apps/backend/Dockerfile -t its-done-backend:railway .; then
    print_status "✅ Backend image built successfully"
else
    print_error "❌ Failed to build backend image"
    exit 1
fi

# Build frontend image
print_status "Building frontend image..."
if docker build -f apps/frontend/Dockerfile -t its-done-frontend:railway .; then
    print_status "✅ Frontend image built successfully"
else
    print_error "❌ Failed to build frontend image"
    exit 1
fi

# Test if images were created
print_status "Verifying images..."
if docker images | grep -q "its-done-backend.*railway"; then
    print_status "✅ Backend image verified"
else
    print_error "❌ Backend image not found"
    exit 1
fi

if docker images | grep -q "its-done-frontend.*railway"; then
    print_status "✅ Frontend image verified"
else
    print_error "❌ Frontend image not found"
    exit 1
fi

print_status "🎉 All images built successfully for Railway deployment!"
print_status "Images created:"
print_status "  - its-done-backend:railway"
print_status "  - its-done-frontend:railway"

echo ""
print_status "To test the images locally:"
print_status "  Backend:  docker run -p 3002:3002 its-done-backend:railway"
print_status "  Frontend: docker run -p 3000:3000 its-done-frontend:railway"

echo ""
print_status "To deploy to Railway:"
print_status "  1. Push your code to your repository"
print_status "  2. Connect your repository to Railway"
print_status "  3. Set the Dockerfile path in Railway settings"
print_status "  4. Deploy!" 