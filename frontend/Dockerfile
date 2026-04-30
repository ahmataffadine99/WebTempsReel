FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Lancement du serveur de développement Vite
CMD ["npm", "run", "dev", "--", "--host"]
