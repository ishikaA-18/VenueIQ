# Use Node.js 18 alpine image for a smaller footprint
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Command to run the app
CMD [ "npm", "start" ]
