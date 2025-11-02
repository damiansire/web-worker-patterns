// shared_worker.js - El Shared Worker que es compartido entre pestañas

console.log('🌐 Shared Worker iniciado');

// Array para mantener todas las conexiones (puertos) activas
const connections = [];
const connectionData = new Map();

let totalConnections = 0;

function broadcastToAll(message, excludePort = null) {
    connections.forEach(conn => {
        if (conn !== excludePort) {
            conn.postMessage(message);
        }
    });
}

function broadcastToAllIncluding(message) {
    connections.forEach(conn => {
        conn.postMessage(message);
    });
}

self.onconnect = function(e) {
    const port = e.ports[0];
    totalConnections++;
    
    console.log(`🔌 Nueva conexión establecida (Total: ${totalConnections})`);
    
    connections.push(port);
    
    port.onmessage = function(event) {
        const { type, tabId, message } = event.data;
        
        console.log(`📨 Mensaje recibido de ${tabId}:`, event.data);
        
        switch (type) {
            case 'connect':
                connectionData.set(port, { tabId });
                
                port.postMessage({
                    type: 'connected',
                    tabId: tabId,
                    connectedCount: connections.length
                });
                
                broadcastToAll({
                    type: 'tabConnected',
                    tabId: tabId,
                    connectedCount: connections.length
                }, port);
                
                console.log(`✅ ${tabId} conectado. Total de conexiones: ${connections.length}`);
                break;
                
            case 'message':
                console.log(`📢 Broadcasting mensaje de ${tabId}: "${message}"`);
                
                broadcastToAllIncluding({
                    type: 'broadcast',
                    tabId: tabId,
                    message: message,
                    timestamp: Date.now()
                });
                break;
                
            case 'disconnect':
                handleDisconnect(port, tabId);
                break;
        }
    };
    
    port.onclose = function() {
        const data = connectionData.get(port);
        const tabId = data ? data.tabId : 'Unknown';
        handleDisconnect(port, tabId);
    };
};

function handleDisconnect(port, tabId) {
    const index = connections.indexOf(port);
    
    if (index !== -1) {
        connections.splice(index, 1);
        connectionData.delete(port);
        
        console.log(`❌ ${tabId} desconectado. Conexiones restantes: ${connections.length}`);
        
        broadcastToAll({
            type: 'tabDisconnected',
            tabId: tabId,
            connectedCount: connections.length
        });
    }
}

console.log('✨ Shared Worker listo para recibir conexiones');

