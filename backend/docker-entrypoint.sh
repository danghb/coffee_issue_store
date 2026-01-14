#!/bin/sh
set -e

# Wait for potential dependencies (not strictly needed for SQLite but good practice)
echo "Starting backend..."

# Ensure the data directory exists
mkdir -p /app/data

# Generate Prisma client in the container runtime environment
echo "Generating Prisma client..."
npx prisma generate

# Run Prisma DB Push to sync schema with SQLite database
echo "Pushing database schema..."
npx prisma db push

# Initial seed - create default admin and basic data
echo "Seeding database..."
npx prisma db seed

# Start the application
echo "Starting Node.js application..."
exec "$@"
