export const transferableObjectsContent = {
  es: {
    title: '🚀 Objetos Transferibles',
    subtitle: 'Ejemplo 05: Transferencia vs. Clonación de datos',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Los objetos transferibles (como ArrayBuffer) pueden "transferir" su propiedad al worker en lugar de ser clonados. Esto es muchísimo más rápido para grandes volúmenes de datos.',
    prerequisite:
      '💡 Hasta ahora, los datos se clonaban al enviarlos al worker. En este ejemplo verás cómo transferir la propiedad para evitar copias costosas.',
    codeSummary: '📖 Ver Código - ¿Cómo funciona?',
    codeSections: {
      createBuffer: '1️⃣ Crear ArrayBuffer',
      methodClone: '2️⃣ Método 1: Clonación (Lento)',
      methodTransfer: '3️⃣ Método 2: Transferencia (Rápido)'
    },
    demo: {
      title: '🖼️ Procesamiento de Imagen',
      sizeLabel: 'Tamaño de los datos:',
      sizeOptions: [
        { value: 1, label: '1 MB (imagen 256x256)' },
        { value: 4, label: '4 MB (imagen 512x512)' },
        { value: 16, label: '16 MB (imagen 1024x1024)' },
        { value: 64, label: '64 MB (imagen 2048x2048)' }
      ],
      transferButton: '⚡ Con Transferencia',
      transferNote: '(Transferir propiedad)',
      cloneButton: '📋 Con Clonación',
      cloneNote: '(Clonación estructurada)'
    },
    comparison: {
      transferLabel: 'Con Transferencia',
      cloneLabel: 'Con Clonación',
      unit: 'milisegundos'
    },
    result: {
      title: '📊 Análisis de Rendimiento',
      improvementLabel: 'Mejora con transferencia:',
      improvementSuffix: '% más rápido',
      differenceLabel: 'Diferencia:',
      differenceSuffix: 'ms ahorrados'
    },
    canvasLabels: { original: 'Original', transfer: 'Con Transferencia', clone: 'Con Clonación' },
    logs: { workerError: 'Error en el worker' },
    takeaways: {
      title: 'Puntos Clave',
      items: [
        'Transferir es instantáneo; clonar crece linealmente con el tamaño',
        'Después de transferir, el buffer original queda inutilizable',
        'Ideal para imágenes, audio y datos binarios grandes'
      ],
      tip: 'Si necesitas mantener los datos originales, usa clone. Si no los necesitas más, usa transfer.'
    }
  },
  en: {
    title: '🚀 Transferable Objects',
    subtitle: 'Example 05: Transferring vs. cloning data',
    infoTitle: '💡 What does this example demonstrate?',
    infoDescription:
      'Transferable objects (like ArrayBuffer) can transfer their ownership to the worker instead of being cloned. This is far faster for large data volumes.',
    prerequisite:
      '💡 Until now, data was cloned when sent to the worker. In this example you\'ll see how to transfer ownership to avoid expensive copies.',
    codeSummary: '📖 View Code - How does it work?',
    codeSections: {
      createBuffer: '1️⃣ Create ArrayBuffer',
      methodClone: '2️⃣ Method 1: Cloning (Slow)',
      methodTransfer: '3️⃣ Method 2: Transferable (Fast)'
    },
    demo: {
      title: '🖼️ Image Processing',
      sizeLabel: 'Data size:',
      sizeOptions: [
        { value: 1, label: '1 MB (256x256 image)' },
        { value: 4, label: '4 MB (512x512 image)' },
        { value: 16, label: '16 MB (1024x1024 image)' },
        { value: 64, label: '64 MB (2048x2048 image)' }
      ],
      transferButton: '⚡ With Transfer',
      transferNote: '(Transfer ownership)',
      cloneButton: '📋 With Cloning',
      cloneNote: '(Structured clone)'
    },
    comparison: { transferLabel: 'With Transfer', cloneLabel: 'With Cloning', unit: 'milliseconds' },
    result: {
      title: '📊 Performance Analysis',
      improvementLabel: 'Transfer improvement:',
      improvementSuffix: '% faster',
      differenceLabel: 'Difference:',
      differenceSuffix: 'ms saved'
    },
    canvasLabels: { original: 'Original', transfer: 'With Transfer', clone: 'With Cloning' },
    logs: { workerError: 'Worker error' },
    takeaways: {
      title: 'Key Takeaways',
      items: [
        'Transferring is instant; cloning grows linearly with size',
        'After transfer, the original buffer becomes unusable',
        'Ideal for images, audio, and large binary data'
      ],
      tip: 'If you need to keep the original data, use clone. If you don\'t need it anymore, use transfer.'
    }
  },
  pt: {
    title: '🚀 Objetos Transferíveis',
    subtitle: 'Exemplo 05: Transferência vs. clonagem de dados',
    infoTitle: '💡 O que este exemplo demonstra?',
    infoDescription:
      'Objetos transferíveis (como ArrayBuffer) podem transferir sua propriedade para o worker em vez de serem clonados. Isso é muito mais rápido para grandes volumes de dados.',
    prerequisite:
      '💡 Até agora, os dados eram clonados ao enviá-los ao worker. Neste exemplo verá como transferir a propriedade para evitar cópias custosas.',
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: {
      createBuffer: '1️⃣ Criar ArrayBuffer',
      methodClone: '2️⃣ Método 1: Clonagem (Lenta)',
      methodTransfer: '3️⃣ Método 2: Transferência (Rápida)'
    },
    demo: {
      title: '🖼️ Processamento de Imagem',
      sizeLabel: 'Tamanho dos dados:',
      sizeOptions: [
        { value: 1, label: '1 MB (imagem 256x256)' },
        { value: 4, label: '4 MB (imagem 512x512)' },
        { value: 16, label: '16 MB (imagem 1024x1024)' },
        { value: 64, label: '64 MB (imagem 2048x2048)' }
      ],
      transferButton: '⚡ Com Transferência',
      transferNote: '(Transferir propriedade)',
      cloneButton: '📋 Com Clonagem',
      cloneNote: '(Clonagem estruturada)'
    },
    comparison: {
      transferLabel: 'Com Transferência',
      cloneLabel: 'Com Clonagem',
      unit: 'milissegundos'
    },
    result: {
      title: '📊 Análise de Desempenho',
      improvementLabel: 'Ganho com transferência:',
      improvementSuffix: '% mais rápido',
      differenceLabel: 'Diferença:',
      differenceSuffix: 'ms economizados'
    },
    canvasLabels: {
      original: 'Original',
      transfer: 'Com Transferência',
      clone: 'Com Clonagem'
    },
    logs: { workerError: 'Erro no worker' },
    takeaways: {
      title: 'Pontos-Chave',
      items: [
        'Transferir é instantâneo; clonar cresce linearmente com o tamanho',
        'Após a transferência, o buffer original fica inutilizável',
        'Ideal para imagens, áudio e dados binários grandes'
      ],
      tip: 'Se precisar manter os dados originais, use clone. Se não precisar mais, use transfer.'
    }
  }
};
