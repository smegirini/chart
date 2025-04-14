# Use a specific Node.js LTS version for consistency
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (React default)
EXPOSE 3000

# Command to run the application (React default)
CMD ["npm", "start"] 