import http from 'http';
import path from 'path';
import cors from 'cors';

import express from 'express';
import { Server } from 'socket.io';
import figlet from 'figlet';

const serverConfig = { port: 3000 };

const app = express();
const DIST_DIR = path.join(__dirname, '../../client/dist');
export const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.use(cors({ origin: '*' })); // Permet de gérer les requêtes cross-origin (CORS).

app.use(express.static(DIST_DIR));
app.use(express.json());

app.use('/', (req, res, next) => {
  res.send('Hello World');
});
app.use('*', (req, res) => res.sendFile(HTML_FILE));

const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Un utilisateur vient de se connecter au serveur ', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`🥷 User ${socket.id} joined room ${roomId}`);
  });

  io.on('offer', (offer, roomId) => {
    // console.log('Pending Session Description to transmit:', peerSession);
    console.log('Offer Event');

    // Send the offer to the peer.
    // io.emit('offer', { peerSession, fromPeerId, toPeerId });
    socket.to(roomId).emit('offer', offer);
  });

  io.on('answer', (answer, roomId) => {
    // console.log('Pending Session Description to transmit:', peerSession);
    console.log('Answer Event');

    // Send the answer back to the peer.
    // io.to(toPeerId).emit('answer', peerSession, fromPeerId, toPeerId);
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('iceCandidate', (candidate, roomId) => {
    socket.to(roomId).emit('ice candidate', candidate);
  });
});

io.on('disconnect', (socket) => {
  console.log('goodbye');
});

server.listen(serverConfig.port, () => {
  console.log(`${figlet.textSync('Bun!')}`);
  console.log(`Listening on http://localhost:${serverConfig.port} ...`);
});
