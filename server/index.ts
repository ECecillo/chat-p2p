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
  console.log('Un utilisateur  vient de se connecter au serveur ', socket.id);

  io.emit('newUser', { peerId: socket.id, signal: '' });
  io.on('offer', ({ peerSession, fromPeerId, toPeerId }) => {
    console.log('Pending Session Description to transmit:', peerSession);
    // Send the offer to the peer.
    io.to(toPeerId).emit('offer', { peerSession, fromPeerId, toPeerId });
  });
  io.on('answer', (peerSession, fromPeerId, toPeerId) => {
    console.log('Pending Session Description to transmit:', peerSession);
    // Send the answer back to the peer.
    io.to(toPeerId).emit('answer', peerSession, fromPeerId, toPeerId);
  });
});

io.on('disconnect', (socket) => {
  console.log('goodbye');
});

server.listen(serverConfig.port, () => {
  console.log(`${figlet.textSync('Bun!')}`);
  console.log(`Listening on http://localhost:${serverConfig.port} ...`);
});
