import { code } from '../../core/utils/code-snippet.helper';

const S_es = {
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

  this.addLog(this.texts().logs?.errorCaptured ?? 'Error capturado en el worker', 'error');
  this.addLog(this.format(this.texts().logs?.errorMessage, { message: event.message }), 'error');
  this.addLog(this.format(this.texts().logs?.errorFile, { file: event.filename }), 'error');
  this.addLog(
    this.format(this.texts().logs?.errorLine, { line: event.lineno, column: event.colno }),
    'error'
  );

  this.addLog(this.texts().logs?.recreatingWorker ?? 'Recreando worker...', 'warning');
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

const S_en = {
  vanillaConfigure: code`
worker.onerror = function (error) {
  console.error('Error:', error.message);
  error.preventDefault();
};
`,
  vanillaThrow: code`
// This will cause a ReferenceError
nonExistentFunction();

// Or throw a custom error
throw new Error('Custom error');
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

const S_pt = {
  vanillaConfigure: code`
worker.onerror = function (error) {
  console.error('Erro:', error.message);
  error.preventDefault();
};
`,
  vanillaThrow: code`
// Isso causará um ReferenceError
funcaoQueNaoExiste();

// Ou lançar erro personalizado
throw new Error('Erro personalizado');
`,
  angularComponent: code`
this.worker.onerror = (event: ErrorEvent) => {
  event.preventDefault();

  this.addLog(this.texts().logs?.errorCaptured ?? 'Erro capturado no worker', 'error');
  this.addLog(this.format(this.texts().logs?.errorMessage, { message: event.message }), 'error');
  this.addLog(this.format(this.texts().logs?.errorFile, { file: event.filename }), 'error');
  this.addLog(
    this.format(this.texts().logs?.errorLine, { line: event.lineno, column: event.colno }),
    'error'
  );

  this.addLog(this.texts().logs?.recreatingWorker ?? 'Recriando worker...', 'warning');
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

export const ERROR_HANDLING_SNIPPETS = { es: S_es, en: S_en, pt: S_pt };
