# Use a Node.js 18 base image, as specified in your engines.
FROM node:18.18.0

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the app using Remix and Vite
RUN pnpm run build

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the application with the appropriate start script
CMD ["pnpm", "run", "preview"]
