# 🚀 Patrones de Web Workers

Este repositorio contiene una colección de ejemplos prácticos para ilustrar los diferentes patrones de uso de los **Web Workers** en JavaScript. El objetivo es mostrar cómo descargar tareas pesadas del hilo principal para mantener una interfaz de usuario fluida y receptiva.

## 📚 Ejemplos Incluidos

1. **01-basic-communication**: El "Hola Mundo" de los Web Workers. Comunicación básica entre el hilo principal y el worker.
2. **02-offloading-computation**: Cómo evitar que la UI se congele ejecutando cálculos pesados en un worker.
3. **03-transferable-objects**: Optimización del rendimiento al transferir objetos grandes como `ArrayBuffer`.
4. **04-error-handling**: Cómo capturar y manejar errores que ocurren dentro de un worker.
5. **05-shared-worker**: Cómo compartir un worker entre múltiples pestañas o iframes.
6. **06-lifecycle-and-termination**: Cómo gestionar el ciclo de vida de un worker y terminarlo explícitamente.

## 🎯 ¿Qué son los Web Workers?

Los Web Workers permiten ejecutar scripts de JavaScript en hilos de fondo, separados del hilo principal de ejecución de una página web. Esto es especialmente útil para:

- Evitar que operaciones costosas bloqueen la interfaz de usuario
- Realizar cálculos complejos sin afectar la experiencia del usuario
- Procesar grandes volúmenes de datos
- Mantener la aplicación responsiva durante tareas intensivas

## 🚀 ¿Cómo ejecutar los ejemplos?

Debido a las políticas de seguridad del navegador (CORS), no puedes ejecutar los ejemplos abriendo los archivos `index.html` directamente. Necesitas un servidor local.

### Opción 1: Usando Python

```bash
# Python 3
python3 -m http.server 8000
```

### Opción 2: Usando Node.js

```bash
# Si tienes npx instalado
npx serve

# O usando http-server
npx http-server
```

### Opción 3: Usando PHP

```bash
php -S localhost:8000
```

### Pasos:

1. Clona este repositorio:
   ```bash
   git clone <tu-repo-url>
   cd web-worker-patterns
   ```
2. Navega a la carpeta de un ejemplo (ej. `cd 01-basic-communication`).
3. Inicia un servidor local usando una de las opciones anteriores.
4. Abre tu navegador en `http://localhost:8000` (o el puerto que indique tu servidor).

## 📖 Orden de Aprendizaje Recomendado

Si eres nuevo en Web Workers, te recomiendo seguir los ejemplos en orden:

1. Comienza con **01-basic-communication** para entender los fundamentos
2. Continúa con **02-offloading-computation** para ver el caso de uso principal
3. Aprende sobre **04-error-handling** para hacer tu código más robusto
4. Explora **03-transferable-objects** para optimizaciones de rendimiento
5. Experimenta con **06-lifecycle-and-termination** para gestión de recursos
6. Finalmente, prueba **05-shared-worker** para casos de uso avanzados

## 🔍 Recursos Adicionales

- [MDN Web Workers API](https://developer.mozilla.org/es/docs/Web/API/Web_Workers_API)
- [HTML5 Rocks - The Basics of Web Workers](https://www.html5rocks.com/en/tutorials/workers/basics/)
- [Can I Use - Web Workers](https://caniuse.com/webworkers)

## 💡 Notas Importantes

- Los Web Workers no tienen acceso al DOM
- La comunicación entre el hilo principal y el worker se hace mediante mensajes
- Los datos se clonan al pasar entre hilos (excepto cuando se usan transferable objects)
- Los Shared Workers requieren soporte del navegador (verifica la compatibilidad)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para nuevos ejemplos o mejoras, no dudes en abrir un issue o pull request.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Siéntete libre de usar estos ejemplos para aprender y enseñar.

---

Hecho con ❤️ para la comunidad de desarrolladores.
