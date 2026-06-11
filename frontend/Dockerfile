# Development stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start Vite dev server with HMR support
# --host 0.0.0.0 allows connections from outside container
# --port 5173 explicitly set port
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
