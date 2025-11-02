// main.js - Demostración de objetos transferibles

const transferBtn = document.getElementById('transferBtn');
const cloneBtn = document.getElementById('cloneBtn');
const sizeSelect = document.getElementById('sizeSelect');
const resultDiv = document.getElementById('result');
const spinner = document.getElementById('spinner');
const canvasContainer = document.getElementById('canvasContainer');
const comparison = document.getElementById('comparison');
const transferTimeEl = document.getElementById('transferTime');
const cloneTimeEl = document.getElementById('cloneTime');

let transferTime = 0;
let cloneTime = 0;

// Crear el worker
const worker = new Worker('worker.js');

// Función para generar datos de imagen (simulación)
function generateImageData(sizeMB) {
    // Calcular dimensiones aproximadas
    const width = Math.sqrt(sizeMB * 1024 * 1024 / 4);
    const height = width;
    const pixels = Math.floor(width * height);
    
    console.log(`📊 Generando imagen de ${Math.floor(width)}x${Math.floor(height)} (${sizeMB} MB)`);
    
    // Crear ArrayBuffer con datos de píxeles (RGBA = 4 bytes por píxel)
    const buffer = new ArrayBuffer(pixels * 4);
    const view = new Uint8Array(buffer);
    
    // Llenar con un patrón de colores
    for (let i = 0; i < pixels; i++) {
        const offset = i * 4;
        view[offset] = (i % 256);           // R
        view[offset + 1] = ((i * 2) % 256); // G
        view[offset + 2] = ((i * 3) % 256); // B
        view[offset + 3] = 255;             // A (opacidad completa)
    }
    
    return {
        buffer: buffer,
        width: Math.floor(width),
        height: Math.floor(height)
    };
}

// Función para mostrar la imagen en canvas
function displayImage(imageData, label) {
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    
    const canvas = document.createElement('canvas');
    const displaySize = 200; // Tamaño de visualización
    canvas.width = displaySize;
    canvas.height = displaySize;
    
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(imageData.width, imageData.height);
    imgData.data.set(new Uint8Array(imageData.buffer));
    
    // Dibujar en un canvas temporal y luego escalar
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imgData, 0, 0);
    
    // Escalar al canvas de visualización
    ctx.drawImage(tempCanvas, 0, 0, displaySize, displaySize);
    
    wrapper.appendChild(labelEl);
    wrapper.appendChild(canvas);
    canvasContainer.appendChild(wrapper);
}

// Función para establecer estado de carga
function setLoading(isLoading) {
    if (isLoading) {
        spinner.classList.add('active');
        transferBtn.disabled = true;
        cloneBtn.disabled = true;
        resultDiv.innerHTML = '';
        canvasContainer.innerHTML = '';
    } else {
        spinner.classList.remove('active');
        transferBtn.disabled = false;
        cloneBtn.disabled = false;
    }
}

// Escuchar mensajes del worker
worker.onmessage = function(e) {
    const { type, imageData, duration, transferable } = e.data;
    
    if (type === 'processed') {
        const endTime = performance.now();
        const totalTime = Math.round(endTime - window.processingStartTime);
        
        console.log(`✅ Procesamiento completado en ${totalTime} ms`);
        console.log(`   - Tiempo en worker: ${duration} ms`);
        console.log(`   - Transferencia: ${totalTime - duration} ms`);
        
        // Mostrar imagen procesada
        displayImage(imageData, transferable ? 'Con Transferencia' : 'Con Clonación');
        
        // Actualizar resultados
        if (transferable) {
            transferTime = totalTime;
            transferTimeEl.textContent = totalTime;
        } else {
            cloneTime = totalTime;
            cloneTimeEl.textContent = totalTime;
        }
        
        // Mostrar comparación si ambos tiempos están disponibles
        if (transferTime > 0 && cloneTime > 0) {
            comparison.style.display = 'grid';
            const improvement = ((cloneTime - transferTime) / cloneTime * 100).toFixed(1);
            
            resultDiv.innerHTML = `
                <strong>📊 Análisis de Rendimiento</strong>
                <p>
                    <strong>Mejora con transferencia:</strong> ${improvement}% más rápido<br>
                    <strong>Diferencia:</strong> ${cloneTime - transferTime} ms ahorrados
                </p>
            `;
        }
        
        setLoading(false);
    }
};

// Botón con transferencia
transferBtn.addEventListener('click', () => {
    const sizeMB = parseInt(sizeSelect.value);
    
    console.log('⚡ Iniciando procesamiento CON transferencia...');
    setLoading(true);
    
    const imageData = generateImageData(sizeMB);
    
    // Mostrar imagen original
    displayImage(imageData, 'Original');
    
    console.log(`📏 Buffer size: ${imageData.buffer.byteLength} bytes`);
    console.log(`✅ Buffer accesible ANTES: ${imageData.buffer.byteLength > 0}`);
    
    window.processingStartTime = performance.now();
    
    // IMPORTANTE: El segundo parámetro es la lista de objetos a transferir
    // Después de esto, imageData.buffer ya no será accesible aquí
    worker.postMessage({
        type: 'process',
        imageData: imageData,
        transferable: true
    }, [imageData.buffer]);
    
    // Intentar acceder al buffer después de transferirlo
    console.log(`❌ Buffer accesible DESPUÉS: ${imageData.buffer.byteLength} (debería dar 0)`);
    console.warn('⚠️ El ArrayBuffer ha sido transferido y ya no es accesible en el hilo principal');
});

// Botón con clonación
cloneBtn.addEventListener('click', () => {
    const sizeMB = parseInt(sizeSelect.value);
    
    console.log('📋 Iniciando procesamiento CON clonación...');
    setLoading(true);
    
    const imageData = generateImageData(sizeMB);
    
    // Mostrar imagen original
    displayImage(imageData, 'Original');
    
    console.log(`📏 Buffer size: ${imageData.buffer.byteLength} bytes`);
    console.log(`✅ Buffer accesible ANTES: ${imageData.buffer.byteLength > 0}`);
    
    window.processingStartTime = performance.now();
    
    // Sin el segundo parámetro, el objeto se clona (más lento para datos grandes)
    worker.postMessage({
        type: 'process',
        imageData: imageData,
        transferable: false
    });
    
    // El buffer sigue siendo accesible porque fue clonado, no transferido
    console.log(`✅ Buffer accesible DESPUÉS: ${imageData.buffer.byteLength} bytes`);
    console.log('✨ El ArrayBuffer fue clonado y sigue accesible en el hilo principal');
});

// Log inicial
console.log('🎬 Ejemplo de Objetos Transferibles listo');
console.log('Prueba ambos métodos y compara el rendimiento');

