// main.js - Demostración de descarga de cómputo pesado

// Función para calcular números primos (versión para el hilo principal)
function calculatePrimes(max) {
    const primes = [];
    
    for (let i = 2; primes.length < max; i++) {
        let isPrime = true;
        
        for (let j = 2; j <= Math.sqrt(i); j++) {
            if (i % j === 0) {
                isPrime = false;
                break;
            }
        }
        
        if (isPrime) {
            primes.push(i);
        }
    }
    
    return primes;
}

// Referencias al DOM
const workerBtn = document.getElementById('workerBtn');
const mainBtn = document.getElementById('mainBtn');
const numberInput = document.getElementById('numberInput');
const resultDiv = document.getElementById('result');
const spinner = document.getElementById('spinner');
const counterDisplay = document.getElementById('counter');

// Contador para demostrar que la UI sigue respondiendo
let counter = 0;
setInterval(() => {
    counter++;
    counterDisplay.textContent = counter;
}, 100);

// Función para mostrar el resultado
function displayResult(primes, duration, method) {
    const lastFive = primes.slice(-5).join(', ');
    
    resultDiv.innerHTML = `
        <strong>✅ Cálculo completado con ${method}</strong><br>
        <strong>Total calculados:</strong> ${primes.length.toLocaleString()} números primos<br>
        <strong>Últimos 5:</strong> ${lastFive}<br>
        <strong>Tiempo transcurrido:</strong> ${duration} ms<br>
        <strong>Número primo más grande:</strong> ${primes[primes.length - 1].toLocaleString()}
    `;
}

// Función para mostrar el estado de carga
function setLoading(isLoading, button) {
    if (isLoading) {
        spinner.classList.add('active');
        workerBtn.disabled = true;
        mainBtn.disabled = true;
        resultDiv.innerHTML = '';
    } else {
        spinner.classList.remove('active');
        workerBtn.disabled = false;
        mainBtn.disabled = false;
    }
}

// ===== OPCIÓN 1: CALCULAR CON WEB WORKER (NO BLOQUEA LA UI) =====
if (window.Worker) {
    const myWorker = new Worker('worker.js');
    
    workerBtn.addEventListener('click', () => {
        const count = parseInt(numberInput.value);
        
        console.log(`🚀 Iniciando cálculo de ${count} números primos en Worker...`);
        setLoading(true);
        
        const startTime = performance.now();
        
        // Enviar la cantidad de primos a calcular al worker
        myWorker.postMessage({ count });
        
        // Escuchar la respuesta del worker
        myWorker.onmessage = function(e) {
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            console.log('✅ Worker completó el cálculo');
            
            setLoading(false);
            displayResult(e.data.primes, duration, 'Web Worker');
        };
        
        myWorker.onerror = function(error) {
            console.error('❌ Error en el worker:', error);
            setLoading(false);
            resultDiv.innerHTML = `<strong style="color: red;">Error: ${error.message}</strong>`;
        };
    });
} else {
    workerBtn.disabled = true;
    workerBtn.textContent = 'Web Workers no soportados';
}

// ===== OPCIÓN 2: CALCULAR EN EL HILO PRINCIPAL (BLOQUEA LA UI) =====
mainBtn.addEventListener('click', () => {
    const count = parseInt(numberInput.value);
    
    console.log(`🐌 Iniciando cálculo de ${count} números primos en el hilo principal...`);
    console.warn('⚠️ La UI se congelará durante el cálculo');
    
    setLoading(true);
    
    // Usamos setTimeout para dar tiempo a que se actualice la UI antes de bloquear
    setTimeout(() => {
        const startTime = performance.now();
        
        // Este cálculo bloqueará el hilo principal
        const primes = calculatePrimes(count);
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log('✅ Cálculo en hilo principal completado');
        
        setLoading(false);
        displayResult(primes, duration, 'Hilo Principal');
        
        // Agregar advertencia
        resultDiv.innerHTML += `
            <div class="warning">
                ⚠️ <strong>Nota:</strong> Durante este cálculo, la UI estuvo completamente congelada.
                El contador se detuvo y las animaciones dejaron de funcionar.
            </div>
        `;
    }, 100);
});

// Información inicial
console.log('📊 Ejemplo de Descarga de Cómputo Pesado');
console.log('Prueba ambos botones y observa cómo se comporta el contador y la animación');

