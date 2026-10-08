FROM node:24-slim

# Build tools in case better-sqlite3 has no prebuilt binary for the platform
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

ENV NODE_ENV=production
# Mount a persistent volume at /data (database + uploaded audio live here)
ENV READUP_DATA_DIR=/data
EXPOSE 3000
CMD ["npm", "run", "start"]
