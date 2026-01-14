# Build stage
FROM docker.m.daocloud.io/node:20-alpine

WORKDIR /app

# Install dependencies including dev dependencies for build/prisma
# Install both openssl runtime and dev package for Prisma
COPY package*.json ./
RUN apk add --no-cache openssl openssl-dev
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Copy and set entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["npm", "run", "dev"]
