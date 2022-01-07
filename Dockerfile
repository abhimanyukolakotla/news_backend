FROM node:slim
WORKDIR /app

COPY package.json .
RUN yarn --ignore-engines

COPY . .
EXPOSE 3000
CMD ["yarn", "start"]