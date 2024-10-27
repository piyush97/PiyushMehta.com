# Use the official Node.js 18 image as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install dependencies
RUN apk add --no-cache curl unzip && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun && \
    bun install --frozen-lockfile && \
    apk del curl unzip

# Copy the rest of your app's source code
COPY . .

# Build your Next.js app
RUN bun run build

# Expose the port Next.js runs on
EXPOSE 3000

# Run the app
CMD ["bun", "start"]
