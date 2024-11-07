FROM node:20.10.0

RUN mkdir -p /app
WORKDIR /app
COPY package.json tsconfig.json nodemon.json ./
COPY ./src/ ./src/
RUN npm install && npm install nxapi@next
RUN npm run build
EXPOSE 3000

CMD ["npm", "run", "start"]
