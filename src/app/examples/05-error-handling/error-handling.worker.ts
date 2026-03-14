console.log('🔧 Worker de demostración de errores iniciado');

self.onmessage = function(e: MessageEvent<{ action: string; errorType: string }>) {
  const { action, errorType } = e.data;
  
  if (action === 'triggerError') {
    console.log(`⚠️ Worker: Provocando error tipo "${errorType}"`);
    
    // Para errores críticos que terminan el worker, no usar try-catch
    // Para que el evento onerror del main sea disparado
    switch (errorType) {
      case 'reference':
        // Error de referencia - termina el worker
        (self as any).funcionQueNoExiste();
        break;
      case 'type':
        // Error de tipo - termina el worker
        const notAFunction = "Soy un string";
        (notAFunction as any)();
        break;
      case 'math':
        // Error matemático - termina el worker
        new Array(-1);
        break;
      case 'custom':
        // Error personalizado - termina el worker
        throw new Error('Este es un error personalizado lanzado intencionalmente desde el worker');
      case 'success':
        // Operación exitosa
        const result = performSafeOperation();
        self.postMessage({ message: 'Operación completada exitosamente', result });
        break;
    }
  }
};

function performSafeOperation() {
  const numbers = [1, 2, 3, 4, 5];
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return `Suma de ${numbers.join(' + ')} = ${sum}`;
}

