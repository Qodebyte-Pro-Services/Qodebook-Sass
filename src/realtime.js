const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

let io = null;
const userSockets = new Map();

async function init(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] },
  });


  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await pubClient.connect();
  await subClient.connect();
  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    console.log('New socket connected:', socket.id);

    socket.on('register', (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
    });

    socket.on('stock_update', (data) => {
      io.emit('stock_update', data); 
    });

    socket.on('disconnect', () => {
      if (socket.userId) userSockets.delete(socket.userId);
    });
  });

  return io;
}

function getIo() {
  return io;
}

function emitStockUpdate(data) {
  if (io) io.emit('stock_update', data);
}

module.exports = { 
  init, 
  io: () => io,        
  getIo,               
  userSockets, 
  emitStockUpdate 
};
