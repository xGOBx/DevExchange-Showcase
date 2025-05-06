FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5713
ENTRYPOINT ["npm", "run", "dev", "--", "--port=5713", "--host=0.0.0.0"]