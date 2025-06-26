#!/bin/bash

# Stop and remove any existing containers
docker-compose -f docker-compose.test.yml down

# Build and start the containers
#  docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml up -d frontend backend db

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if frontend is ready
echo "Checking if frontend is ready..."
until $(curl --output /dev/null --silent --head --fail http://localhost:3000); do
    printf '.'
    sleep 5
done
echo "Frontend is ready!"

# Check if backend is ready
echo "Checking if backend is ready..."
until $(curl --output /dev/null --silent --head --fail http://localhost:3002); do
    printf '.'
    sleep 5
done
echo "Backend is ready!"

# Run Cypress tests
docker-compose -f docker-compose.test.yml run --rm cypress

# Get the exit code from Cypress
CYPRESS_EXIT_CODE=$?

# Stop all containers
docker-compose -f docker-compose.test.yml down

# Exit with Cypress exit code
exit $CYPRESS_EXIT_CODE 