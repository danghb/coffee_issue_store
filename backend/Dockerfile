# Build stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies including dev dependencies for build/prisma
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start command (using ts-node for simplicity as per current dev setup, 
# or build and run node dist/app.js for better performance)
# For this setup, we stick to what works in dev unless user requested otherwise, 
# but for Docker production it's better to verify if build works.
# Given the user wants "quick start", let's try to run via ts-node but 
# ensuring we have a robust start. 
CMD ["npm", "run", "dev"]
