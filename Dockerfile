# Dockerfile para servir los ejemplos de Web Workers

# Usar nginx como servidor web ligero
FROM nginx:alpine

# Copiar todos los archivos del proyecto al directorio de nginx
COPY . /usr/share/nginx/html/

# Crear una configuración personalizada de nginx
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Habilitar CORS para Web Workers \
    add_header Access-Control-Allow-Origin *; \
    \
    # Servir archivos estáticos \
    location / { \
        try_files $uri $uri/ =404; \
        autoindex on; \
        autoindex_exact_size off; \
        autoindex_localtime on; \
    } \
    \
    # Configurar tipos MIME correctos \
    location ~* \.js$ { \
        add_header Content-Type application/javascript; \
    } \
    \
    # Cache para archivos estáticos \
    location ~* \.(html|css|js)$ { \
        expires 1h; \
        add_header Cache-Control "public, must-revalidate, proxy-revalidate"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando por defecto (nginx ya está configurado en la imagen base)
CMD ["nginx", "-g", "daemon off;"]

