console.log('🔧 Worker de procesamiento de imagen iniciado');

function processImage(imageData: { width: number; height: number; buffer: ArrayBuffer }): { width: number; height: number; buffer: ArrayBuffer } {
  const view = new Uint8Array(imageData.buffer);
  const pixels = view.length / 4;
  
  for (let i = 0; i < pixels; i++) {
    const offset = i * 4;
    view[offset] = 255 - view[offset];
    view[offset + 1] = 255 - view[offset + 1];
    view[offset + 2] = 255 - view[offset + 2];
  }
  
  return imageData;
}

self.onmessage = function(e: MessageEvent<{ type: string; imageData: any; transferable: boolean }>) {
  const { type, imageData, transferable } = e.data;
  
  if (type === 'process') {
    console.log(`🖼️ Worker procesando imagen de ${imageData.width}x${imageData.height}`);
    const startTime = performance.now();
    const processed = processImage(imageData);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    if (transferable) {
      self.postMessage({ type: 'processed', imageData: processed, duration, transferable: true }, [processed.buffer]);
    } else {
      self.postMessage({ type: 'processed', imageData: processed, duration, transferable: false });
    }
  }
};

