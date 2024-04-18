const { WebSocketServer } = require('ws');
const uuid = require('uuid');

function peerProxy(httpServer) {
  // Create a WebSocket server attached to the existing HTTP server
  const wss = new WebSocketServer({ noServer: true });

  // Handle the HTTP-to-WebSocket upgrade
  httpServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request);
    });
  });

  // Maintain a list of connections
  let connections = [];

  wss.on('connection', (ws) => {
    const connection = { id: uuid.v4(), alive: true, ws: ws };
    connections.push(connection);

    // Broadcast incoming messages to all other connected clients
    ws.on('message', data => {
      connections.forEach((c) => {
        if (c.id !== connection.id && c.ws.readyState === ws.OPEN) {
          c.ws.send(data);
        }
      });
    });

    // Clean up after connections close
    ws.on('close', () => {
      connections = connections.filter(c => c.id !== connection.id);
    });

    // Handle keep-alive with pings
    ws.on('pong', () => {
      connection.alive = true;
    });
  });

  // Periodically check for and close dead connections
  setInterval(() => {
    connections.forEach(c => {
      if (!c.alive) {
        c.ws.terminate();
      } else {
        c.alive = false; // Assume connection is dead until next pong
        c.ws.ping();
      }
    });
  }, 10000);
}

module.exports = { peerProxy };
