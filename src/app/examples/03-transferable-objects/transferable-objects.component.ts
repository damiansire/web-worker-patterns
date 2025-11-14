import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LanguageService } from '../../core/services/language.service';

const block = (...lines: string[]) => `${lines.join('\n')}\n`;

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
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent],
  templateUrl: './transferable-objects.component.html',
  styleUrl: './transferable-objects.component.scss',
  standalone: true
})
export class TransferableObjectsComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.transferableObjects'));
  readonly codeSnippets = {
    vanillaCreateBuffer: block(
      'const imageData = new ImageData(1024, 1024);',
      'const buffer = imageData.data.buffer;'
    ),
    vanillaClone: block(
      'worker.postMessage({ imageData });',
      '// El buffer original sigue siendo accesible'
    ),
    vanillaTransfer: block(
      'worker.postMessage({ imageData }, [imageData.data.buffer]);',
      '// ⚠️ El buffer original queda INACCESIBLE'
    ),
    angularComponent: block(
      'private generateImageData(sizeMB: number) {',
      '  const width = Math.sqrt((sizeMB * 1024 * 1024) / 4);',
      '  const pixels = Math.floor(width * width);',
      '',
      '  const buffer = new ArrayBuffer(pixels * 4);',
      '  const view = new Uint8Array(buffer);',
      '',
      '  for (let i = 0; i < pixels; i++) {',
      '    const offset = i * 4;',
      '    view[offset] = i % 256;',
      '    view[offset + 1] = (i * 2) % 256;',
      '    view[offset + 2] = (i * 3) % 256;',
      '    view[offset + 3] = 255;',
      '  }',
      '',
      '  return {',
      '    buffer,',
      '    width: Math.floor(width),',
      '    height: Math.floor(width)',
      '  };',
      '}',
      '',
      'processWithClone() {',
      '  const sizeMB = this.sizeMB();',
      '  this.isLoading.set(true);',
      '',
      '  const imageData = this.generateImageData(sizeMB);',
      "  this.displayImage(imageData, 'original');",
      '  this.processingStartTime = performance.now();',
      '',
      '  this.worker?.postMessage({',
      "    type: 'process',",
      '    imageData,',
      '    transferable: false',
      '  });',
      '}',
      '',
      'processWithTransfer() {',
      '  const sizeMB = this.sizeMB();',
      '  this.isLoading.set(true);',
      '',
      '  const imageData = this.generateImageData(sizeMB);',
      "  this.displayImage(imageData, 'original');",
      '  this.processingStartTime = performance.now();',
      '',
      '  this.worker?.postMessage({',
      "    type: 'process',",
      '    imageData,',
      '    transferable: true',
      '  }, [imageData.buffer]);',
      '}'
    )
  };

  readonly sizeOptions = computed(() =>
    (this.texts().demo?.sizeOptions ?? []) as { value: number; label: string }[]
  );

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
            this.displayImage(e.data.imageData, 'transfer');
          } else {
            this.cloneTime.set(totalTime);
            this.displayImage(e.data.imageData, 'clone');
          }

          this.isLoading.set(false);
        }
      };

      this.worker.onerror = (e: ErrorEvent) => {
        console.error(`${this.texts().logs.workerError}:`, e);
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

  private displayImage(imageData: ImageData, labelKey: 'original' | 'transfer' | 'clone') {
    if (!this.canvasContainer) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    
    const labelEl = document.createElement('label');
    const labels = this.texts().canvasLabels ?? {};
    labelEl.textContent = labels[labelKey] ?? '';
    
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
    this.displayImage(imageData, 'original');
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
    this.displayImage(imageData, 'original');
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
