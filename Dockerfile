# Use the official Node.js image
FROM node:20.11

# Install pm2 globally
RUN npm install -g pm2

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app will run on
EXPOSE 3000

# Start the application with pm2
CMD ["pm2-runtime", "start", "server.js", "--watch"]
