FROM node:18
WORKDIR /app
RUN npm i -g serve
RUN mkdir -p ./_next
COPY ./out/* ./
COPY ./out/_next ./_next
EXPOSE 3000
CMD ["npx", "serve", "./"]
