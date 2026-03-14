import { code } from '../../core/utils/code-snippet.helper';

export const ERROR_HANDLING_SNIPPETS = {
  vanillaConfigure: code`
worker.onerror = function (error) {
  console.error('Error:', error.message);
  error.preventDefault();
};
`,
  vanillaThrow: code`
// Esto causará un ReferenceError
funcionQueNoExiste();

// O lanzar error personalizado
throw new Error('Error personalizado');
`,
  angularComponent: code`
this.worker.onerror = (event: ErrorEvent) => {
  event.preventDefault();

  this.addLog(this.texts().logs?.errorCaptured ?? 'Error captured in worker', 'error');
  this.addLog(this.format(this.texts().logs?.errorMessage, { message: event.message }), 'error');
  this.addLog(this.format(this.texts().logs?.errorFile, { file: event.filename }), 'error');
  this.addLog(
    this.format(this.texts().logs?.errorLine, { line: event.lineno, column: event.colno }),
    'error'
  );

  this.addLog(this.texts().logs?.recreatingWorker ?? 'Recreating worker...', 'warning');
  setTimeout(() => {
    this.worker?.terminate();
    this.createWorker();
  }, 100);
};

triggerError(type: string) {
  this.addLog(
    this.format(this.texts().logs?.triggerError, {
      type: this.getErrorTypeLabel(type as any)
    }),
    'info'
  );

  this.worker?.postMessage({
    action: 'triggerError',
    errorType: type
  });
}
`
};
