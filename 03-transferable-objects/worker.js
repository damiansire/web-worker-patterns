// worker.js - Procesamiento de imagen con objetos transferibles

console.log('🔧 Worker de procesamiento de imagen iniciado');

// Función para procesar la imagen (aplicar un efecto)
function processImage(imageData) {
    const view = new Uint8Array(imageData.buffer);
    const pixels = view.length / 4;
    
    // Aplicar un efecto de inversión de colores
    for (let i = 0; i < pixels; i++) {
        const offset = i * 4;
        view[offset] = 255 - view[offset];         // Invertir R
        view[offset + 1] = 255 - view[offset + 1]; // Invertir G
        view[offset + 2] = 255 - view[offset + 2]; // Invertir B
        // view[offset + 3] permanece igual (alpha)
    }
    
    return imageData;
}

// Escuchar mensajes del hilo principal
self.onmessage = function(e) {
    const { type, imageData, transferable } = e.data;
    
    if (type === 'process') {
        console.log(`🖼️ Worker procesando imagen de ${imageData.width}x${imageData.height}`);
        console.log(`   Método: ${transferable ? 'Transferencia' : 'Clonación'}`);
        
        const startTime = performance.now();
        
        // Procesar la imagen
        const processed = processImage(imageData);
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log(`✅ Procesamiento completado en ${duration} ms`);
        
        // Enviar de vuelta al hilo principal
        if (transferable) {
            // Con transferencia: devolvemos el buffer transferido
            self.postMessage({
                type: 'processed',
                imageData: processed,
                duration: duration,
                transferable: true
            }, [processed.buffer]);
            
            console.log('⚡ Datos enviados con transferencia');
        } else {
            // Con clonación: el buffer se clona automáticamente
            self.postMessage({
                type: 'processed',
                imageData: processed,
                duration: duration,
                transferable: false
            });
            
            console.log('📋 Datos enviados con clonación');
        }
    }
};

// Nota importante sobre objetos transferibles:
// 
// VENTAJAS:
// - Muchísimo más rápido para datos grandes (zero-copy)
// - No duplica memoria
// - Ideal para ArrayBuffer, MessagePort, ImageBitmap, etc.
//
// DESVENTAJAS:
// - El objeto original ya no es accesible en el emisor
// - Solo funciona con tipos específicos de objetos
//
// CUÁNDO USAR:
// - Procesamiento de imágenes, audio, video
// - Grandes conjuntos de datos numéricos
// - Cuando no necesitas conservar el objeto original

