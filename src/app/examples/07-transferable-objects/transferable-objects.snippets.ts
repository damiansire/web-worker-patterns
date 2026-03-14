import { code } from '../../core/utils/code-snippet.helper';

const S_es = {
  vanillaCreateBuffer: code`
const imageData = new ImageData(1024, 1024);
const buffer = imageData.data.buffer;
`,
  vanillaClone: code`
// Clonar copia cada byte; lento y costoso en memoria para buffers grandes
worker.postMessage({ imageData });
// El buffer original sigue siendo accesible
`,
  vanillaTransfer: code`
// Transfer = cero copias: la propiedad pasa al worker, el original queda desasignado
worker.postMessage({ imageData }, [imageData.data.buffer]);
// ⚠️ El buffer original queda INACCESIBLE
`,
  angularComponent: code`
private generateImageData(sizeMB: number) {
  const width = Math.sqrt((sizeMB * 1024 * 1024) / 4);
  const pixels = Math.floor(width * width);

  const buffer = new ArrayBuffer(pixels * 4);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < pixels; i++) {
    const offset = i * 4;
    view[offset] = i % 256;
    view[offset + 1] = (i * 2) % 256;
    view[offset + 2] = (i * 3) % 256;
    view[offset + 3] = 255;
  }

  return {
    buffer,
    width: Math.floor(width),
    height: Math.floor(width)
  };
}

processWithClone() {
  const sizeMB = this.sizeMB();
  this.isLoading.set(true);

  const imageData = this.generateImageData(sizeMB);
  this.displayImage(imageData, 'original');
  this.processingStartTime = performance.now();

  // Usar clone para datos pequeños o cuando necesites el original después de enviar
  this.worker?.postMessage({
    type: 'process',
    imageData,
    transferable: false
  });
}

processWithTransfer() {
  const sizeMB = this.sizeMB();
  this.isLoading.set(true);

  const imageData = this.generateImageData(sizeMB);
  this.displayImage(imageData, 'original');
  this.processingStartTime = performance.now();

  // Usar transfer para ArrayBuffers grandes cuando no necesites el original
  this.worker?.postMessage({
    type: 'process',
    imageData,
    transferable: true
  }, [imageData.buffer]);
}
`
};

const S_en = {
  vanillaCreateBuffer: code`
const imageData = new ImageData(1024, 1024);
const buffer = imageData.data.buffer;
`,
  vanillaClone: code`
// Cloning copies every byte—slow and memory-heavy for large buffers
worker.postMessage({ imageData });
// Original buffer remains accessible
`,
  vanillaTransfer: code`
// Transfer = zero-copy: ownership moves to worker, original becomes detached
worker.postMessage({ imageData }, [imageData.data.buffer]);
// ⚠️ Original buffer becomes INACCESSIBLE
`,
  angularComponent: code`
private generateImageData(sizeMB: number) {
  const width = Math.sqrt((sizeMB * 1024 * 1024) / 4);
  const pixels = Math.floor(width * width);

  const buffer = new ArrayBuffer(pixels * 4);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < pixels; i++) {
    const offset = i * 4;
    view[offset] = i % 256;
    view[offset + 1] = (i * 2) % 256;
    view[offset + 2] = (i * 3) % 256;
    view[offset + 3] = 255;
  }

  return {
    buffer,
    width: Math.floor(width),
    height: Math.floor(width)
  };
}

processWithClone() {
  const sizeMB = this.sizeMB();
  this.isLoading.set(true);

  const imageData = this.generateImageData(sizeMB);
  this.displayImage(imageData, 'original');
  this.processingStartTime = performance.now();

  // Use clone for small data or when you need the original after sending
  this.worker?.postMessage({
    type: 'process',
    imageData,
    transferable: false
  });
}

processWithTransfer() {
  const sizeMB = this.sizeMB();
  this.isLoading.set(true);

  const imageData = this.generateImageData(sizeMB);
  this.displayImage(imageData, 'original');
  this.processingStartTime = performance.now();

  // Use transfer for large ArrayBuffers when you won't need the original
  this.worker?.postMessage({
    type: 'process',
    imageData,
    transferable: true
  }, [imageData.buffer]);
}
`
};

const S_pt = {
  vanillaCreateBuffer: code`
const imageData = new ImageData(1024, 1024);
const buffer = imageData.data.buffer;
`,
  vanillaClone: code`
// Clonar copia cada byte; lento e pesado em memória para buffers grandes
worker.postMessage({ imageData });
// O buffer original continua acessível
`,
  vanillaTransfer: code`
// Transfer = zero-copy: a propriedade vai para o worker, o original fica desanexado
worker.postMessage({ imageData }, [imageData.data.buffer]);
// ⚠️ O buffer original fica INACESSÍVEL
`,
  angularComponent: code`
private generateImageData(sizeMB: number) {
  const width = Math.sqrt((sizeMB * 1024 * 1024) / 4);
  const pixels = Math.floor(width * width);

  const buffer = new ArrayBuffer(pixels * 4);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < pixels; i++) {
    const offset = i * 4;
    view[offset] = i % 256;
    view[offset + 1] = (i * 2) % 256;
    view[offset + 2] = (i * 3) % 256;
    view[offset + 3] = 255;
  }

  return {
    buffer,
    width: Math.floor(width),
    height: Math.floor(width)
  };
}

processWithClone() {
  const sizeMB = this.sizeMB();
  this.isLoading.set(true);

  const imageData = this.generateImageData(sizeMB);
  this.displayImage(imageData, 'original');
  this.processingStartTime = performance.now();

  // Use clone para dados pequenos ou quando precisar do original após enviar
  this.worker?.postMessage({
    type: 'process',
    imageData,
    transferable: false
  });
}

processWithTransfer() {
  const sizeMB = this.sizeMB();
  this.isLoading.set(true);

  const imageData = this.generateImageData(sizeMB);
  this.displayImage(imageData, 'original');
  this.processingStartTime = performance.now();

  // Use transfer para ArrayBuffers grandes quando não precisar do original
  this.worker?.postMessage({
    type: 'process',
    imageData,
    transferable: true
  }, [imageData.buffer]);
}
`
};

export const TRANSFERABLE_OBJECTS_SNIPPETS = { es: S_es, en: S_en, pt: S_pt };
