import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LogPanelComponent, LogEntry } from '../../core/components/log-panel/log-panel.component';
import { LanguageService } from '../../core/services/language.service';

const block = (...lines: string[]) => `${lines.join('\n')}\n`;

type ErrorKey = 'reference' | 'type' | 'math' | 'custom' | 'success';

@Component({
  selector: 'app-error-handling',
  imports: [CommonModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent],
  templateUrl: './error-handling.component.html',
  styleUrl: './error-handling.component.scss',
  standalone: true
})
export class ErrorHandlingComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.errorHandling'));
  readonly codeSnippets = {
    vanillaConfigure: block(
      'worker.onerror = function (error) {',
      "  console.error('Error:', error.message);",
      '  error.preventDefault();',
      '};'
    ),
    vanillaThrow: block(
      '// Esto causará un ReferenceError',
      'funcionQueNoExiste();',
      '',
      '// O lanzar error personalizado',
      "throw new Error('Error personalizado');"
    ),
    angularComponent: block(
      'this.worker.onerror = (event: ErrorEvent) => {',
      '  event.preventDefault();',
      '',
      "  this.addLog(this.texts().logs?.errorCaptured ?? 'Error captured in worker', 'error');",
      '  this.addLog(this.format(this.texts().logs?.errorMessage, { message: event.message }), ' +
        "'error');",
      '  this.addLog(this.format(this.texts().logs?.errorFile, { file: event.filename }), ' +
        "'error');",
      '  this.addLog(' +
        'this.format(this.texts().logs?.errorLine, { line: event.lineno, column: event.colno }), ' +
        "'error');",
      '',
      "  this.addLog(this.texts().logs?.recreatingWorker ?? 'Recreating worker...', 'warning');",
      '  setTimeout(() => {',
      '    this.worker?.terminate();',
      '    this.createWorker();',
      '  }, 100);',
      '};',
      '',
      'triggerError(type: string) {',
      '  this.addLog(',
      '    this.format(this.texts().logs?.triggerError, {',
      '      type: this.getErrorTypeLabel(type as any)',
      '    }),',
      "    'info'",
      '  );',
      '',
      '  this.worker?.postMessage({',
      "    action: 'triggerError',",
      '    errorType: type',
      '  });',
      '}'
    )
  };

  readonly errorKeys: ErrorKey[] = ['reference', 'type', 'math', 'custom', 'success'];

  logs = signal<LogEntry[]>([]);
  private worker?: Worker;

  ngOnInit() {
    this.createWorker();
  }

  private createWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./error-handling.worker', import.meta.url), { type: 'module' });
      this.addLog(this.texts().logs?.workerCreated ?? 'Worker created', 'success');

      this.worker.onmessage = (e: MessageEvent) => {
        if (e.data.message) {
          this.addLog(this.format(this.texts().logs?.messageReceived, { message: e.data.message }), 'success');
        }
        if (e.data.result) {
          this.addLog(this.format(this.texts().logs?.resultReceived, { result: e.data.result }), 'info');
        }
      };

      this.worker.onerror = (e: ErrorEvent) => {
        // Prevenir que el error se propague y cause problemas
        e.preventDefault();

        this.addLog(this.texts().logs?.errorCaptured ?? 'Error captured in worker', 'error');
        this.addLog(this.format(this.texts().logs?.errorMessage, { message: e.message }), 'error');
        this.addLog(this.format(this.texts().logs?.errorFile, { file: e.filename }), 'error');
        this.addLog(
          this.format(this.texts().logs?.errorLine, { line: e.lineno, column: e.colno }),
          'error'
        );

        // Recrear el worker para que siga funcionando
        this.addLog(this.texts().logs?.recreatingWorker ?? 'Recreating worker...', 'warning');
        setTimeout(() => {
          this.worker?.terminate();
          this.createWorker();
        }, 100);
      };

      if (this.logs().length === 0) {
        this.addLog(this.texts().logs?.systemReady ?? 'System ready', 'success');
      }
    } else {
      const message = this.texts().alerts?.unsupported ?? 'Web Workers not supported';
      alert(message);
      this.addLog(message, 'error');
    }
  }

  ngOnDestroy() {
    this.worker?.terminate();
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update(l => [...l, { timestamp, message, type }]);
  }

  triggerError(errorType: string) {
    const key = (errorType as ErrorKey) ?? 'custom';
    this.addLog(
      this.format(this.texts().logs?.triggerError, { type: this.getErrorTypeLabel(key) }),
      'info'
    );
    this.worker?.postMessage({ action: 'triggerError', errorType });
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog(this.texts().logs?.consoleCleared ?? 'Console cleared', 'info');
  }

  private getErrorTypeLabel(type: ErrorKey): string {
    return this.texts().errorTypes?.[type]?.logLabel ?? type;
  }

  private format(template: string | undefined, params: Record<string, string | number>): string {
    if (!template) {
      return Object.values(params).join(' ');
    }
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      template
    );
  }
}
