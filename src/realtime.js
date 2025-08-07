
const { Server } = require('socket.io');
let io = null;
const userSockets = new Map();

function init(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTION'] }
  });
  io.on('connection', (socket) => {

    socket.on('register', (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
    });

   
    socket.on('stock_update', (data) => {
      socket.broadcast.emit('stock_update', data);
    });

    socket.on('disconnect', () => {
      if (socket.userId) userSockets.delete(socket.userId);
    });
  });
}


function emitStockUpdate(data) {
  if (io) io.emit('stock_update', data);
}

module.exports = { init, get io() { return io; }, userSockets, emitStockUpdate };