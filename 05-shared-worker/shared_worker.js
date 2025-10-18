// shared_worker.js - El Shared Worker que es compartido entre pestañas

console.log('🌐 Shared Worker iniciado');

// Array para mantener todas las conexiones (puertos) activas
const connections = [];
const connectionData = new Map(); // Para guardar info de cada conexión

// Contador de conexiones totales (para debugging)
let totalConnections = 0;

// Función auxiliar para broadcast a todas las conexiones
function broadcastToAll(message, excludePort = null) {
    connections.forEach(conn => {
        if (conn !== excludePort) {
            conn.postMessage(message);
        }
    });
}

// Función para broadcast incluyendo el puerto que envía
function broadcastToAllIncluding(message) {
    connections.forEach(conn => {
        conn.postMessage(message);
    });
}

// Evento principal: se dispara cuando una nueva pestaña se conecta
self.onconnect = function(e) {
    const port = e.ports[0];
    totalConnections++;
    
    console.log(`🔌 Nueva conexión establecida (Total: ${totalConnections})`);
    
    // Agregar el puerto a la lista de conexiones
    connections.push(port);
    
    // Escuchar mensajes de esta conexión específica
    port.onmessage = function(event) {
        const { type, tabId, message } = event.data;
        
        console.log(`📨 Mensaje recibido de ${tabId}:`, event.data);
        
        switch (type) {
            case 'connect':
                // Una nueva pestaña se conectó
                connectionData.set(port, { tabId });
                
                // Informar a la pestaña que se conectó exitosamente
                port.postMessage({
                    type: 'connected',
                    tabId: tabId,
                    connectedCount: connections.length
                });
                
                // Notificar a otras pestañas sobre la nueva conexión
                broadcastToAll({
                    type: 'tabConnected',
                    tabId: tabId,
                    connectedCount: connections.length
                }, port);
                
                console.log(`✅ ${tabId} conectado. Total de conexiones: ${connections.length}`);
                break;
                
            case 'message':
                // Broadcast del mensaje a todas las pestañas (incluyendo el emisor)
                console.log(`📢 Broadcasting mensaje de ${tabId}: "${message}"`);
                
                broadcastToAllIncluding({
                    type: 'broadcast',
                    tabId: tabId,
                    message: message,
                    timestamp: Date.now()
                });
                break;
                
            case 'disconnect':
                // Una pestaña se está desconectando (cerrada)
                handleDisconnect(port, tabId);
                break;
        }
    };
    
    // Manejar cierre de puerto (cuando se cierra la pestaña)
    port.onclose = function() {
        const data = connectionData.get(port);
        const tabId = data ? data.tabId : 'Unknown';
        handleDisconnect(port, tabId);
    };
};

// Función para manejar desconexiones
function handleDisconnect(port, tabId) {
    const index = connections.indexOf(port);
    
    if (index !== -1) {
        connections.splice(index, 1);
        connectionData.delete(port);
        
        console.log(`❌ ${tabId} desconectado. Conexiones restantes: ${connections.length}`);
        
        // Notificar a las demás pestañas
        broadcastToAll({
            type: 'tabDisconnected',
            tabId: tabId,
            connectedCount: connections.length
        });
    }
}

// Nota: Los Shared Workers tienen un ciclo de vida diferente a los Workers normales
// - Se mantienen activos mientras haya al menos una conexión activa
// - Cuando todas las pestañas se cierran, el Shared Worker es terminado
// - Son reutilizados cuando una nueva pestaña se conecta (si aún están activos)

console.log('✨ Shared Worker listo para recibir conexiones');

// Ejemplo de estado compartido que persiste entre pestañas
const sharedState = {
    messageCount: 0,
    startTime: Date.now()
};

// Puedes actualizar este estado desde cualquier pestaña
// y será accesible desde todas las demás

// Logging periódico para debugging (opcional)
setInterval(() => {
    if (connections.length > 0) {
        console.log(`📊 Estado del Shared Worker:`);
        console.log(`   - Conexiones activas: ${connections.length}`);
        console.log(`   - Conexiones totales histórico: ${totalConnections}`);
        console.log(`   - Tiempo activo: ${Math.round((Date.now() - sharedState.startTime) / 1000)}s`);
    }
}, 30000); // Cada 30 segundos

