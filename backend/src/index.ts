import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import sseRoutes from './routes/sse';
import messageRoutes from './routes/messages';
import { initChatSockets } from './sockets/chat';
import { setIO } from './socket';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/sse', sseRoutes);
app.use('/messages', messageRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});


setIO(io);
initChatSockets(io);


app.get('/', (req, res) => {
  res.send('Banque AVENIR API en cours d\'exécution...');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
