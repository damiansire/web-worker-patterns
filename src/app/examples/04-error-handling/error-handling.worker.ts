console.log('🔧 Worker de demostración de errores iniciado');

self.onmessage = function(e: MessageEvent<{ action: string; errorType: string }>) {
  const { action, errorType } = e.data;
  
  if (action === 'triggerError') {
    console.log(`⚠️ Worker: Provocando error tipo "${errorType}"`);
    
    switch (errorType) {
      case 'reference':
        (self as any).funcionQueNoExiste();
        break;
      case 'type':
        const notAFunction = "Soy un string";
        (notAFunction as any)();
        break;
      case 'math':
        new Array(-1);
        break;
      case 'custom':
        throw new Error('Este es un error personalizado lanzado intencionalmente desde el worker');
      case 'success':
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

