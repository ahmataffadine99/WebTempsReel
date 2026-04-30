import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('Banque AVENIR API en cours d\'exécution...');
});

// Setup basique de Socket.io
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté :', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté :', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
