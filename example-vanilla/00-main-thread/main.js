// main.js - Demostración del bloqueo del Main Thread

// Función para calcular números primos (versión bloqueante)
function calculatePrimes(max) {
    const primes = [];
    
    // Este bucle es intensivo y bloqueará el hilo principal
    for (let i = 2; primes.length < max; i++) {
        let isPrime = true;
        
        // Verificar si i es primo
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
const calculateButton = document.getElementById('calculateButton');
const numberInput = document.getElementById('numberInput');
const resultDiv = document.getElementById('result');
const spinner = document.getElementById('spinner');
const counterDisplay = document.getElementById('counter');

// Contador para demostrar que la UI se congela
let counter = 0;
setInterval(() => {
    counter++;
    counterDisplay.textContent = counter;
}, 100);

// Función para mostrar el resultado
function displayResult(primes, duration) {
    const lastFive = primes.slice(-5).join(', ');
    
    resultDiv.innerHTML = `
        <div class="result-content">
            <strong>✅ Cálculo completado</strong><br>
            <strong>Total calculados:</strong> ${primes.length.toLocaleString()} números primos<br>
            <strong>Últimos 5:</strong> ${lastFive}<br>
            <strong>Tiempo transcurrido:</strong> ${duration} ms<br>
            <strong>Número primo más grande:</strong> ${primes[primes.length - 1].toLocaleString()}
        </div>
        <div class="warning" style="margin-top: 15px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px;">
            <strong>⚠️ Nota importante:</strong> Durante este cálculo, la UI estuvo completamente congelada.
            El contador se detuvo y las animaciones dejaron de funcionar. Este es el problema que los Web Workers resuelven.
        </div>
    `;
}

// Función para mostrar el estado de carga
function setLoading(isLoading) {
    if (isLoading) {
        spinner.classList.add('active');
        calculateButton.disabled = true;
        numberInput.disabled = true;
        resultDiv.innerHTML = '';
    } else {
        spinner.classList.remove('active');
        calculateButton.disabled = false;
        numberInput.disabled = false;
    }
}

// ===== CALCULAR EN EL MAIN THREAD (BLOQUEA LA UI) =====
calculateButton.addEventListener('click', () => {
    const count = parseInt(numberInput.value);
    
    console.log(`🔒 Iniciando cálculo de ${count} números primos en el Main Thread...`);
    console.warn('⚠️ ADVERTENCIA: La UI se congelará durante el cálculo');
    
    setLoading(true);
    
    // Usamos setTimeout para dar tiempo a que se actualice la UI antes de bloquear
    setTimeout(() => {
        const startTime = performance.now();
        
        // ⚠️ ESTE CÁLCULO BLOQUEARÁ EL HILO PRINCIPAL
        // Durante este tiempo, la UI estará completamente congelada
        const primes = calculatePrimes(count);
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log('✅ Cálculo en Main Thread completado');
        console.log(`Tiempo total: ${duration}ms`);
        console.warn('⚠️ Durante ese tiempo, la UI estuvo congelada');
        
        setLoading(false);
        displayResult(primes, duration);
    }, 100);
});

// Información inicial
console.log('🔒 Ejemplo de Bloqueo del Main Thread');
console.log('Este ejemplo demuestra el problema que los Web Workers resuelven');
console.log('Prueba el botón y observa cómo el contador se congela durante el cálculo');

