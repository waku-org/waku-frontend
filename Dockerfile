# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install Vite globally (optional if not using npx or npm run dev directly)
RUN npm install -g vite

# Expose the port Vite runs on
EXPOSE 5173

# Ensure node_modules/.bin is in the PATH
ENV PATH /app/node_modules/.bin:$PATH

# Run the Vite development server
CMD ["npm", "run", "dev"]

