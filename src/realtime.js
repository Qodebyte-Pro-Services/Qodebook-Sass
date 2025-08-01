
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
    socket.on('disconnect', () => {
      if (socket.userId) userSockets.delete(socket.userId);
    });
  });
}

module.exports = { init, get io() { return io; }, userSockets };