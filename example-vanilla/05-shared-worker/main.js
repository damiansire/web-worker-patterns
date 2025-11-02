// main.js - Cliente de Shared Worker

// Referencias al DOM
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messagesContainer');
const workerStatusEl = document.getElementById('workerStatus');
const tabIdEl = document.getElementById('tabId');
const connectedTabsEl = document.getElementById('connectedTabs');

// Generar un ID único para esta pestaña
const tabId = 'Tab-' + Math.random().toString(36).substr(2, 9);
tabIdEl.textContent = tabId;

// Función para agregar un mensaje a la interfaz
function addMessage(sender, text, type = 'other') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'sender';
    senderDiv.textContent = sender;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    textDiv.textContent = text;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(textDiv);
    messageDiv.appendChild(timestamp);
    
    messagesContainer.appendChild(messageDiv);
    
    // Auto scroll
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Verificar si el navegador soporta Shared Workers
if (window.SharedWorker) {
    console.log('✅ SharedWorker soportado');
    
    // Crear el Shared Worker
    const sharedWorker = new SharedWorker('shared_worker.js');
    
    // La comunicación con Shared Workers se hace a través de un puerto
    const port = sharedWorker.port;
    
    // Iniciar la conexión
    port.start();
    
    console.log(`🔌 Conectado al Shared Worker con ID: ${tabId}`);
    
    // Actualizar estado
    workerStatusEl.textContent = 'Conectado';
    workerStatusEl.classList.add('active');
    
    // Enviar mensaje inicial de conexión
    port.postMessage({
        type: 'connect',
        tabId: tabId
    });
    
    // Escuchar mensajes del Shared Worker
    port.onmessage = function(e) {
        const { type, tabId: senderTabId, message, connectedCount } = e.data;
        
        console.log('📨 Mensaje recibido del Shared Worker:', e.data);
        
        switch (type) {
            case 'connected':
                addMessage('🤖 Sistema', `Conectado como ${tabId}`, 'system');
                connectedTabsEl.textContent = connectedCount;
                break;
                
            case 'update':
                // Actualizar contador de pestañas conectadas
                connectedTabsEl.textContent = connectedCount;
                break;
                
            case 'broadcast':
                // Mensaje de otra pestaña
                const isOwnMessage = senderTabId === tabId;
                addMessage(
                    senderTabId,
                    message,
                    isOwnMessage ? 'own' : 'other'
                );
                break;
                
            case 'tabDisconnected':
                addMessage(
                    '🤖 Sistema',
                    `${senderTabId} se ha desconectado`,
                    'system'
                );
                connectedTabsEl.textContent = connectedCount;
                break;
                
            case 'tabConnected':
                addMessage(
                    '🤖 Sistema',
                    `${senderTabId} se ha conectado`,
                    'system'
                );
                connectedTabsEl.textContent = connectedCount;
                break;
        }
    };
    
    // Manejar errores
    port.onerror = function(error) {
        console.error('❌ Error en Shared Worker:', error);
        addMessage('🤖 Sistema', 'Error en la conexión', 'system');
        workerStatusEl.textContent = 'Error';
        workerStatusEl.classList.remove('active');
    };
    
    // Función para enviar mensaje
    function sendMessage() {
        const message = messageInput.value.trim();
        
        if (message) {
            console.log('📤 Enviando mensaje:', message);
            
            // Enviar al Shared Worker
            port.postMessage({
                type: 'message',
                tabId: tabId,
                message: message
            });
            
            // Limpiar input
            messageInput.value = '';
            messageInput.focus();
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Limpiar la conexión cuando se cierra la pestaña
    window.addEventListener('beforeunload', function() {
        port.postMessage({
            type: 'disconnect',
            tabId: tabId
        });
    });
    
} else {
    // Shared Workers no soportados
    console.error('❌ SharedWorker no está soportado en este navegador');
    
    workerStatusEl.textContent = 'No Soportado';
    workerStatusEl.style.background = '#f44336';
    
    addMessage(
        '🤖 Sistema',
        'Tu navegador no soporta Shared Workers. Por favor, usa Chrome o Firefox.',
        'system'
    );
    
    sendButton.disabled = true;
    messageInput.disabled = true;
}

// Notas sobre Shared Workers:
//
// DIFERENCIAS CON WORKERS NORMALES:
// 1. Se comparten entre múltiples contextos (pestañas, iframes)
// 2. La comunicación se hace a través de puertos (MessagePort)
// 3. Necesitas llamar port.start() para iniciar la comunicación
// 4. El worker usa onconnect en lugar de onmessage
//
// CASOS DE USO:
// - Chat entre pestañas
// - Sincronización de estado
// - Gestión centralizada de WebSockets
// - Caché compartida
// - Coordinación de tareas entre pestañas
//
// LIMITACIONES:
// - No soportado en Safari
// - Puede ser terminado por el navegador si no hay pestañas activas
// - Más complejo que Workers normales

