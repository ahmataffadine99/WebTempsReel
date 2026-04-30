FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Script that runs prisma generate, migrate, seed and then starts dev server
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate dev --name init && npx prisma db seed && npm run dev"]
