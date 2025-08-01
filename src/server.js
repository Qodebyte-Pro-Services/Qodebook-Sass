const app = require('./app');
const http = require('http');
const server = http.createServer(app);
const { init: initRealtime } = require('./realtime');
initRealtime(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
