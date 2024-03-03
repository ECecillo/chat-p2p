import { io } from "..";

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinChatRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('offer', (offer, roomId) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (answer, roomId) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('iceCandidate', (candidate, roomId) => {
    socket.to(roomId).emit('ice candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
