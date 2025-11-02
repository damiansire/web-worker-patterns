import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ImageData {
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

interface ProcessResult {
  type: string;
  imageData: ImageData;
  duration: number;
  transferable: boolean;
}

@Component({
  selector: 'app-transferable-objects',
  imports: [CommonModule, FormsModule],
  templateUrl: './transferable-objects.component.html',
  styleUrl: './transferable-objects.component.scss',
  standalone: true
})
export class TransferableObjectsComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef<HTMLDivElement>;
  
  sizeMB = signal(16);
  isLoading = signal(false);
  transferTime = signal(0);
  cloneTime = signal(0);
  private worker?: Worker;
  private processingStartTime?: number;

  ngOnInit() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./transferable-objects.worker', import.meta.url), { type: 'module' });

      this.worker.onmessage = (e: MessageEvent<ProcessResult>) => {
        if (e.data.type === 'processed') {
          const endTime = performance.now();
          const totalTime = Math.round(endTime - (this.processingStartTime || 0));

          if (e.data.transferable) {
            this.transferTime.set(totalTime);
            this.displayImage(e.data.imageData, 'Con Transferencia');
          } else {
            this.cloneTime.set(totalTime);
            this.displayImage(e.data.imageData, 'Con Clonación');
          }

          this.isLoading.set(false);
        }
      };

      this.worker.onerror = (e: ErrorEvent) => {
        console.error('Worker error:', e);
        this.isLoading.set(false);
      };
    }
  }

  ngOnDestroy() {
    this.worker?.terminate();
  }

  private generateImageData(sizeMB: number): ImageData {
    const width = Math.sqrt(sizeMB * 1024 * 1024 / 4);
    const height = width;
    const pixels = Math.floor(width * height);

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
      height: Math.floor(height)
    };
  }

  private displayImage(imageData: ImageData, label: string) {
    if (!this.canvasContainer) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    
    const canvas = document.createElement('canvas');
    const displaySize = 200;
    canvas.width = displaySize;
    canvas.height = displaySize;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imgData = ctx.createImageData(imageData.width, imageData.height);
      imgData.data.set(new Uint8Array(imageData.buffer));
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imageData.width;
      tempCanvas.height = imageData.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, displaySize, displaySize);
      }
    }
    
    wrapper.appendChild(labelEl);
    wrapper.appendChild(canvas);
    this.canvasContainer.nativeElement.appendChild(wrapper);
  }

  processWithTransfer() {
    const sizeMB = this.sizeMB();
    this.isLoading.set(true);
    if (this.canvasContainer) {
      this.canvasContainer.nativeElement.innerHTML = '';
    }
    
    const imageData = this.generateImageData(sizeMB);
    this.displayImage(imageData, 'Original');
    this.processingStartTime = performance.now();

    if (this.worker) {
      this.worker.postMessage({
        type: 'process',
        imageData,
        transferable: true
      }, [imageData.buffer]);
    }
  }

  processWithClone() {
    const sizeMB = this.sizeMB();
    this.isLoading.set(true);
    if (this.canvasContainer) {
      this.canvasContainer.nativeElement.innerHTML = '';
    }
    
    const imageData = this.generateImageData(sizeMB);
    this.displayImage(imageData, 'Original');
    this.processingStartTime = performance.now();

    if (this.worker) {
      this.worker.postMessage({
        type: 'process',
        imageData,
        transferable: false
      });
    }
  }
}
