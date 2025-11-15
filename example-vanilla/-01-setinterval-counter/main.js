// main.js - Ejemplo de contador con setInterval

let contador = 0;
let intervalId = null;
let velocidad = 1000; // milisegundos

// Referencias al DOM
const counterDisplay = document.getElementById('counter');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Función para actualizar el contador
function actualizarContador() {
    contador++;
    counterDisplay.textContent = contador;
}

// Función para iniciar el contador
function iniciarContador() {
    if (intervalId !== null) {
        return; // Ya está corriendo
    }
    
    actualizarContador(); // Actualizar inmediatamente
    intervalId = setInterval(actualizarContador, velocidad);
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    console.log(`✅ Contador iniciado (cada ${velocidad}ms)`);
}

// Función para pausar el contador
function pausarContador() {
    if (intervalId === null) {
        return; // No está corriendo
    }
    
    clearInterval(intervalId);
    intervalId = null;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    console.log('⏸️ Contador pausado');
}

// Función para reiniciar el contador
function reiniciarContador() {
    pausarContador();
    contador = 0;
    counterDisplay.textContent = contador;
    
    console.log('🔄 Contador reiniciado');
}

// Event listeners
startBtn.addEventListener('click', iniciarContador);
pauseBtn.addEventListener('click', pausarContador);
resetBtn.addEventListener('click', reiniciarContador);

// Control de velocidad
speedSlider.addEventListener('input', function(e) {
    velocidad = parseInt(e.target.value);
    speedValue.textContent = velocidad + ' ms';
    
    // Si el contador está corriendo, reiniciarlo con la nueva velocidad
    if (intervalId !== null) {
        pausarContador();
        iniciarContador();
    }
    
    console.log(`⚙️ Velocidad cambiada a ${velocidad}ms`);
});

// Información inicial
console.log('⏱️ Ejemplo de Contador con setInterval');
console.log('Este ejemplo muestra cómo usar setInterval para ejecutar código periódicamente');
console.log('Es fundamental entender esto antes de aprender sobre Web Workers');

