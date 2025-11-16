console.log('🌐 Shared Worker iniciado');

const connections: any[] = [];
const connectionData = new Map();
let totalConnections = 0;

function broadcastToAll(message: any, excludePort: any = null) {
  connections.forEach(conn => {
    if (conn !== excludePort) {
      conn.postMessage(message);
    }
  });
}

self.onconnect = function(e: any) {
  const port = e.ports[0];
  totalConnections++;
  
  connections.push(port);
  
  port.onmessage = function(event: any) {
    const { type, tabId, message } = event.data;
    
    switch (type) {
      case 'connect':
        connectionData.set(port, { tabId });
        port.postMessage({ type: 'connected', tabId, connectedCount: connections.length });
        broadcastToAll({ type: 'tabConnected', tabId, connectedCount: connections.length }, port);
        break;
      case 'message':
        connections.forEach(conn => {
          conn.postMessage({ type: 'broadcast', tabId, message, timestamp: Date.now() });
        });
        break;
    }
  };
  
  port.onclose = function() {
    const data = connectionData.get(port);
    const tabId = data ? data.tabId : 'Unknown';
    const index = connections.indexOf(port);
    if (index !== -1) {
      connections.splice(index, 1);
      connectionData.delete(port);
      broadcastToAll({ type: 'tabDisconnected', tabId, connectedCount: connections.length });
    }
  };
};

