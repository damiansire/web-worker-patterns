// worker.js - Procesamiento de objetos transferibles

console.log('🔧 Worker de objetos transferibles iniciado');

// Función para procesar imagen
function processImage(imageData) {
    console.log('Procesando imagen con buffer de', imageData.data.buffer.byteLength, 'bytes');
    
    // Simular procesamiento
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Invertir colores como ejemplo
        data[i] = 255 - data[i];     // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
    }
    
    return imageData;
}

self.onmessage = function(e) {
    const { imageData } = e.data;
    
    console.log('✅ Worker recibió imagen, procesando...');
    
    const processed = processImage(imageData);
    
    // Devolver con transferencia
    self.postMessage({ result: processed }, [processed.data.buffer]);
    
    console.log('✅ Worker envió resultado');
};

