// main.js - Hilo principal de ejecución

// Verificar si el navegador soporta Web Workers
if (window.Worker) {
    // Crear una nueva instancia del worker
    const myWorker = new Worker('worker.js');
    
    // Referencias al DOM
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Limpiar el contenedor de mensajes al inicio
    messagesContainer.innerHTML = '';
    
    // Función para agregar un mensaje al contenedor
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message from-${sender}`;
        
        const senderLabel = document.createElement('strong');
        senderLabel.textContent = sender === 'main' ? '📤 Hilo Principal' : '📥 Worker';
        
        const messageText = document.createElement('div');
        messageText.textContent = text;
        
        messageDiv.appendChild(senderLabel);
        messageDiv.appendChild(messageText);
        
        messagesContainer.appendChild(messageDiv);
        
        // Auto scroll hacia el último mensaje
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Escuchar mensajes del worker
    myWorker.onmessage = function(e) {
        console.log('✅ Mensaje recibido del worker:', e.data);
        addMessage(e.data, 'worker');
    };
    
    // Manejar errores del worker
    myWorker.onerror = function(error) {
        console.error('❌ Error en el worker:', error.message);
        addMessage(`Error: ${error.message}`, 'worker');
    };
    
    // Enviar mensaje al worker cuando se hace clic en el botón
    sendButton.addEventListener('click', function() {
        const message = messageInput.value.trim();
        
        if (message) {
            console.log('📤 Enviando mensaje al worker:', message);
            
            // Agregar el mensaje enviado a la interfaz
            addMessage(message, 'main');
            
            // Enviar el mensaje al worker usando postMessage
            myWorker.postMessage(message);
            
            // Limpiar el input
            messageInput.value = '';
            messageInput.focus();
        }
    });
    
    // También permitir enviar con Enter
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
    
    // Mensaje inicial
    console.log('🎬 Worker creado y listo para recibir mensajes');
    
} else {
    // El navegador no soporta Web Workers
    alert('❌ Tu navegador no soporta Web Workers. Por favor, usa un navegador moderno.');
    console.error('Web Workers no están disponibles en este navegador');
}

