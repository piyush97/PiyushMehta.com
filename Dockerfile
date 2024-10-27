# Use the official Node.js 18 image as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or pnpm-lock.yaml)
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of your app's source code
COPY . .

# Build your Next.js app
RUN pnpm build

# Expose the port Next.js runs on
EXPOSE 3000

# Run the app
CMD ["pnpm", "start"]

