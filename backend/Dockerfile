# Use a specific Node.js LTS version for consistency
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json (if available)
# This step leverages Docker layer caching
COPY package*.json ./

# Install dependencies including devDependencies for development stage
RUN npm install

# Copy the rest of the application code
COPY . .

# Build TypeScript code (Not strictly needed for dev with ts-node, but good practice)
# RUN npm run build 

# Expose the port the app runs on (as defined in .env or default)
# The EXPOSE instruction doesn't actually publish the port. It functions as a type of documentation 
# between the person who builds the image and the person who runs the container.
EXPOSE ${PORT:-4000} 

# Command to run the application in development mode (uses ts-node)
# This will be overridden by docker-compose command: npm run dev
CMD ["npm", "run", "dev"] 