import { code } from '../../core/utils/code-snippet.helper';

export const TRANSFERABLE_OBJECTS_SNIPPETS = {
  vanillaCreateBuffer: code`
const imageData = new ImageData(1024, 1024);
const buffer = imageData.data.buffer;
`,
  vanillaClone: code`
worker.postMessage({ imageData });
// El buffer original sigue siendo accesible
`,
  vanillaTransfer: code`
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

  this.worker?.postMessage({
    type: 'process',
    imageData,
    transferable: true
  }, [imageData.buffer]);
}
`
};
